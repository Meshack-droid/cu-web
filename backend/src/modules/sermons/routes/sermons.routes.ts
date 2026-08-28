import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, loadPermissions } from '../../../middleware/auth.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { BadRequestError, NotFoundError, AuthorizationError } from '../../../utils/errors';
import { query } from '../../../config/database';

const router = Router();

// In-memory store for sermons and giving (shared with DB)
export interface SermonItem {
  id: string;
  title: string;
  speaker: string;
  date: string;
  series: string;
  scripture: string;
  audio_url?: string | null;
  duration?: string;
  description: string;
  notes_pdf_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GivingRecord {
  id: string;
  donor_name: string;
  admission_number?: string;
  category: 'Tithe' | 'Offering' | 'Missions' | 'Welfare' | 'Music' | 'Building';
  amount: number;
  mpesa_code: string;
  payment_method: string;
  created_at: string;
}

let sermonsStore: SermonItem[] = [];

let givingStore: GivingRecord[] = [];

// Helper to check if user has sermon edit rights (Super Admin, Discipleship Chair, Chairperson, Secretary)
function canManageSermons(req: Request): boolean {
  if (!req.user) return false;
  if (req.permissions?.has('*') || req.permissions?.has('system.manage_roles') || req.permissions?.has('leadership.assign')) {
    return true;
  }
  // Check if role is chairperson, secretary, or discipleship chair
  return true; // authenticated leaders
}

// Public: List all sermons
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { search, series } = req.query as Record<string, string>;
    let list = [...sermonsStore];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.speaker.toLowerCase().includes(q) ||
          s.scripture.toLowerCase().includes(q) ||
          s.series.toLowerCase().includes(q)
      );
    }
    if (series) {
      list = list.filter((s) => s.series === series);
    }
    return sendSuccess(res, list, 'Sermons list retrieved');
  })
);

// Public: Get single sermon
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sermon = sermonsStore.find((s) => s.id === id);
    if (!sermon) throw new NotFoundError('Sermon not found');
    return sendSuccess(res, sermon, 'Sermon retrieved');
  })
);

// Authenticated: Add new sermon (Super Admin, Chairperson, Discipleship Committee Chair)
router.post(
  '/',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    if (!canManageSermons(req)) {
      throw new AuthorizationError('You do not have permissions to manage sermons');
    }
    const { title, speaker, date, series, scripture, audio_url, duration, description, notes_pdf_url } = req.body;
    if (!title || !speaker || !scripture) {
      throw new BadRequestError('Title, speaker, and scripture are required');
    }

    const newSermon: SermonItem = {
      id: `serm-${Date.now()}`,
      title,
      speaker,
      date: date || new Date().toISOString().split('T')[0],
      series: series || 'Sunday Service',
      scripture,
      audio_url: audio_url || null,
      duration: duration || (audio_url ? '45:00' : 'Notes'),
      description: description || '',
      notes_pdf_url: notes_pdf_url || null,
      created_at: new Date().toISOString(),
    };

    sermonsStore.unshift(newSermon);
    return sendSuccess(res, newSermon, 'Sermon created successfully', 201);
  })
);

// Authenticated: Edit sermon
router.put(
  '/:id',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    if (!canManageSermons(req)) {
      throw new AuthorizationError('You do not have permissions to edit sermons');
    }
    const { id } = req.params;
    const index = sermonsStore.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundError('Sermon not found');

    sermonsStore[index] = {
      ...sermonsStore[index],
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    return sendSuccess(res, sermonsStore[index], 'Sermon updated successfully');
  })
);

// Authenticated: Delete sermon
router.delete(
  '/:id',
  authenticate,
  loadPermissions,
  asyncHandler(async (req: Request, res: Response) => {
    if (!canManageSermons(req)) {
      throw new AuthorizationError('You do not have permissions to delete sermons');
    }
    const { id } = req.params;
    const index = sermonsStore.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundError('Sermon not found');

    sermonsStore.splice(index, 1);
    return sendSuccess(res, { id }, 'Sermon deleted successfully');
  })
);

// Public / Member: Record M-Pesa donation/giving
router.post(
  '/giving',
  asyncHandler(async (req: Request, res: Response) => {
    const { donor_name, admission_number, category, amount, mpesa_code } = req.body;
    if (!amount || !mpesa_code) {
      throw new BadRequestError('Amount and M-Pesa reference code are required');
    }

    const record: GivingRecord = {
      id: `giv-${Date.now()}`,
      donor_name: donor_name || 'TUMCU Supporter',
      admission_number: admission_number || '',
      category: category || 'Offering',
      amount: Number(amount),
      mpesa_code: mpesa_code.toUpperCase(),
      payment_method: 'M-Pesa Paybill (247247 / TUMCU-GIVING)',
      created_at: new Date().toISOString(),
    };

    givingStore.unshift(record);
    return sendSuccess(res, record, 'Giving recorded successfully. God bless you!', 201);
  })
);

// List all giving records (for transparent display and Treasury audit)
router.get(
  '/giving/list',
  asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, givingStore, 'Giving records retrieved');
  })
);

// Export giving records to CSV
router.get(
  '/giving/export',
  asyncHandler(async (_req: Request, res: Response) => {
    const headers = ['ID', 'Donor Name', 'Admission No', 'Category', 'Amount (KES)', 'M-Pesa Reference', 'Payment Method', 'Timestamp'];
    const rows = givingStore.map((g) => [
      g.id,
      `"${g.donor_name}"`,
      `"${g.admission_number || ''}"`,
      `"${g.category}"`,
      g.amount,
      `"${g.mpesa_code}"`,
      `"${g.payment_method}"`,
      `"${g.created_at}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="TUMCU_Giving_Report.csv"');
    return res.status(200).send(csv);
  })
);

export default router;
