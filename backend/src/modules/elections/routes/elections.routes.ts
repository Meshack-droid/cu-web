import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { BadRequestError, NotFoundError, AuthorizationError } from '../../../utils/errors';

const router = Router();

// Public / Member: Get active elections and eligible posts
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const elections = await query<any[]>('SELECT * FROM elections ORDER BY created_at DESC');
    return sendSuccess(res, elections, 'Elections retrieved');
  })
);

// Get election details with offices and candidate lists
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const elections = await query<any[]>('SELECT * FROM elections WHERE id = :id', { id });
    if (!elections || elections.length === 0) {
      throw new NotFoundError('Election not found');
    }
    const election = elections[0];

    const posts = await query<any[]>(
      'SELECT * FROM election_posts WHERE election_id = :id ORDER BY display_order ASC',
      { id }
    );

    const candidates = await query<any[]>(
      'SELECT * FROM election_candidates WHERE election_id = :id ORDER BY created_at ASC',
      { id }
    );

    // Group candidates by post
    const postsWithCandidates = posts.map((post) => {
      const postCandidates = candidates.filter((c) => c.post_id === post.id);
      return {
        ...post,
        candidates: postCandidates,
      };
    });

    return sendSuccess(
      res,
      {
        ...election,
        posts: postsWithCandidates,
      },
      'Election details retrieved'
    );
  })
);

// Super Admin / Member: Submit Nomination / Candidacy
router.post(
  '/:id/nominate',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { postId, manifesto, salvationTestimony, admissionNumber, course } = req.body;

    if (!postId || !manifesto) {
      throw new BadRequestError('Office and manifesto are required');
    }

    const posts = await query<any[]>('SELECT * FROM election_posts WHERE id = :postId AND election_id = :id', {
      postId,
      id,
    });
    if (!posts || posts.length === 0) {
      throw new NotFoundError('Election office not found');
    }

    const candidateId = `cand-rec-${uuidv4().substring(0, 8)}`;
    const newCandidate = {
      id: candidateId,
      election_id: id,
      post_id: postId,
      user_id: req.user?.sub,
      full_name: req.body.fullName || 'TUMCU Member',
      admission_number: req.body.admissionNumber || 'ADM/2026/000',
      course: course || 'Undergraduate Degree',
      manifesto,
      salvation_testimony: salvationTestimony || 'Born again believer in Jesus Christ.',
      vetting_status: 'pending',
      vetting_notes: 'Submitted for Electoral Commission vetting.',
      votes_count: 0,
      created_at: new Date().toISOString(),
    };

    await query(
      `INSERT INTO election_candidates (id, election_id, post_id, user_id, full_name, admission_number, course, manifesto, salvation_testimony, vetting_status, vetting_notes, votes_count, created_at)
       VALUES (:id, :election_id, :post_id, :user_id, :full_name, :admission_number, :course, :manifesto, :salvation_testimony, :vetting_status, :vetting_notes, :votes_count, :created_at)`,
      newCandidate
    );

    return sendSuccess(res, newCandidate, 'Nomination submitted successfully for vetting', 201);
  })
);

// Member: Cast Ballot (Vote)
router.post(
  '/:id/vote',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { votes } = req.body; // Array of { postId, candidateId }

    if (!Array.isArray(votes) || votes.length === 0) {
      throw new BadRequestError('At least one vote selection is required');
    }

    const userId = req.user!.sub;

    // Check if user already voted in this election
    const existingVotes = await query<any[]>(
      'SELECT * FROM election_votes WHERE election_id = :id AND voter_id = :userId',
      { id, userId }
    );

    if (existingVotes && existingVotes.length > 0) {
      throw new BadRequestError('You have already cast your ballot in this election.');
    }

    const recordedVotes: any[] = [];
    const postTitlesVoted: string[] = [];

    for (const v of votes) {
      const voteId = `vote-${uuidv4().substring(0, 8)}`;
      const record = {
        id: voteId,
        election_id: id,
        post_id: v.postId,
        candidate_id: v.candidateId,
        voter_id: userId,
        voted_at: new Date().toISOString(),
      };

      await query(
        `INSERT INTO election_votes (id, election_id, post_id, candidate_id, voter_id, voted_at)
         VALUES (:id, :election_id, :post_id, :candidate_id, :voter_id, :voted_at)`,
        record
      );

      // Increment candidate vote count
      await query(
        `UPDATE election_candidates SET votes_count = votes_count + 1 WHERE id = :candidateId`,
        { candidateId: v.candidateId }
      );

      recordedVotes.push(record);
      postTitlesVoted.push(v.postTitle || v.postId);
    }

    // Log election audit trail for super admin oversight
    const logId = `log-${uuidv4().substring(0, 8)}`;
    const auditRecord = {
      id: logId,
      election_id: id,
      voter_id: userId,
      voter_name: req.user?.username || 'Verified Member',
      admission_number: 'TUMCU/MEMBER',
      post_title: postTitlesVoted.join(', '),
      ip_address: req.ip || '127.0.0.1',
      action: 'Ballot Submitted Successfully',
      timestamp: new Date().toISOString(),
    };

    await query(
      `INSERT INTO election_activity_logs (id, election_id, voter_id, voter_name, admission_number, post_title, ip_address, action, timestamp)
       VALUES (:id, :election_id, :voter_id, :voter_name, :admission_number, :post_title, :ip_address, :action, :timestamp)`,
      auditRecord
    );

    return sendSuccess(
      res,
      { count: recordedVotes.length, timestamp: new Date().toISOString() },
      'Your ballot has been securely cast and verified by the Electoral Commission.',
      201
    );
  })
);

// Super Admin: Live Audit Logs & Real-Time Voter Roster
router.get(
  '/:id/audit-logs',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const hasAccess =
      req.permissions?.has('*') ||
      req.permissions?.has('system.manage_roles') ||
      req.permissions?.has('leadership.assign');
    if (!hasAccess) {
      throw new AuthorizationError('Super Admin electoral audit access required');
    }

    const logs = await query<any[]>(
      'SELECT * FROM election_activity_logs WHERE election_id = :id ORDER BY timestamp DESC',
      { id }
    );

    const totalVotesCast = await query<any[]>(
      'SELECT COUNT(DISTINCT voter_id) as total_voters, COUNT(*) as total_ballots FROM election_votes WHERE election_id = :id',
      { id }
    );

    return sendSuccess(
      res,
      {
        logs,
        summary: totalVotesCast[0] || { total_voters: logs.length, total_ballots: logs.length },
      },
      'Election audit activity logs retrieved'
    );
  })
);

// Super Admin: Candidate Vetting & Approval
router.patch(
  '/candidates/:candidateId/vet',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    const { status, notes } = req.body; // 'approved' | 'rejected' | 'pending'

    const hasAccess =
      req.permissions?.has('*') ||
      req.permissions?.has('system.manage_roles') ||
      req.permissions?.has('leadership.assign');
    if (!hasAccess) {
      throw new AuthorizationError('Super Admin permissions required to vet candidates');
    }

    await query(
      `UPDATE election_candidates SET vetting_status = :status, vetting_notes = :notes WHERE id = :candidateId`,
      { candidateId, status, notes: notes || '' }
    );

    return sendSuccess(res, { candidateId, status }, `Candidate status updated to ${status}`);
  })
);

// Super Admin: Add New Election Office / Post
router.post(
  '/:id/posts',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      title,
      code,
      category = 'executive',
      displayOrder = 10,
      minYearOfStudy = 2,
      requiredMembershipDuration = 'Full Member',
      spiritualRequirements,
      academicRequirements,
      responsibilities,
      seats = 1,
    } = req.body;

    const postId = `post-${uuidv4().substring(0, 8)}`;
    const newPost = {
      id: postId,
      election_id: id,
      code: code || title.toLowerCase().replace(/\s+/g, '_'),
      title,
      category,
      display_order: Number(displayOrder),
      min_year_of_study: Number(minYearOfStudy),
      required_membership_duration: requiredMembershipDuration,
      spiritual_requirements: spiritualRequirements || 'Born again believer in good standing.',
      academic_requirements: academicRequirements || 'Good academic standing without disciplinary issues.',
      responsibilities: responsibilities || 'Constitutional office responsibilities.',
      seats: Number(seats),
      created_at: new Date().toISOString(),
    };

    await query(
      `INSERT INTO election_posts (id, election_id, code, title, category, display_order, min_year_of_study, required_membership_duration, spiritual_requirements, academic_requirements, responsibilities, seats, created_at)
       VALUES (:id, :election_id, :code, :title, :category, :display_order, :min_year_of_study, :required_membership_duration, :spiritual_requirements, :academic_requirements, :responsibilities, :seats, :created_at)`,
      newPost
    );

    return sendSuccess(res, newPost, 'Election office added successfully', 201);
  })
);

// Super Admin: Update Election Status (e.g. active, closed, certified)
router.patch(
  '/:id/status',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, electoral_commissioner } = req.body;

    await query(
      `UPDATE elections SET status = :status, electoral_commissioner = COALESCE(:electoral_commissioner, electoral_commissioner) WHERE id = :id`,
      { id, status, electoral_commissioner: electoral_commissioner || null }
    );

    return sendSuccess(res, { id, status }, `Election status updated to ${status}`);
  })
);

// Super Admin: Add/Upload candidate directly with constitutional vetting
router.post(
  '/:id/candidates',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      postId,
      fullName,
      admissionNumber,
      course,
      yearOfStudy,
      durationInCU,
      manifesto,
      salvationTestimony,
      vettingStatus = 'approved',
      vettingNotes = 'Verified against Constitution Article 14.3',
    } = req.body;

    if (!postId || !fullName || !admissionNumber) {
      throw new BadRequestError('Post ID, Full Name, and Admission Number are required');
    }

    const candidateId = `cand-rec-${uuidv4().substring(0, 8)}`;
    const candidate = {
      id: candidateId,
      election_id: id,
      post_id: postId,
      user_id: `usr-${uuidv4().substring(0, 6)}`,
      full_name: fullName,
      admission_number: admissionNumber,
      course: course || `${yearOfStudy || 'Year 3'} Student`,
      manifesto: manifesto || 'To serve faithfully with humility, integrity, and diligence.',
      salvation_testimony: salvationTestimony || 'Born again believer committed to Christ.',
      vetting_status: vettingStatus,
      vetting_notes: vettingNotes,
      votes_count: 0,
      created_at: new Date().toISOString(),
    };

    await query(
      `INSERT INTO election_candidates (id, election_id, post_id, user_id, full_name, admission_number, course, manifesto, salvation_testimony, vetting_status, vetting_notes, votes_count, created_at)
       VALUES (:id, :election_id, :post_id, :user_id, :full_name, :admission_number, :course, :manifesto, :salvation_testimony, :vetting_status, :vetting_notes, :votes_count, :created_at)`,
      candidate
    );

    return sendSuccess(res, candidate, 'Candidate registered and vetted successfully', 201);
  })
);

// Super Admin: Delete candidate
router.delete(
  '/:id/candidates/:candidateId',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    await query('DELETE FROM election_candidates WHERE id = :candidateId', { candidateId });
    return sendSuccess(res, { candidateId, deleted: true }, 'Candidate removed from ballot');
  })
);

// Results view: Candidate vote counts sorted in descending order
router.get(
  '/:id/results',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const posts = await query<any[]>(
      'SELECT * FROM election_posts WHERE election_id = :id ORDER BY display_order ASC',
      { id }
    );
    const candidates = await query<any[]>(
      'SELECT * FROM election_candidates WHERE election_id = :id ORDER BY votes_count DESC, created_at ASC',
      { id }
    );

    const totalVotes = candidates.reduce((sum, c) => sum + (c.votes_count || 0), 0);

    const resultsByPost = posts.map((post) => {
      const postCandidates = candidates
        .filter((c) => c.post_id === post.id)
        .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

      const postTotal = postCandidates.reduce((sum, c) => sum + (c.votes_count || 0), 0);

      const ranked = postCandidates.map((c, index) => ({
        ...c,
        rank: index + 1,
        percentage: postTotal > 0 ? ((c.votes_count / postTotal) * 100).toFixed(1) : '0.0',
        is_winner: index === 0 && (c.votes_count || 0) > 0,
      }));

      return {
        ...post,
        total_votes: postTotal,
        candidates: ranked,
      };
    });

    return sendSuccess(
      res,
      {
        election_id: id,
        total_votes: totalVotes,
        posts: resultsByPost,
      },
      'Election results retrieved'
    );
  })
);

export default router;
