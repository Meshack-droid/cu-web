export interface MembershipApplication {
  id: string;
  user_id: string;
  membership_type_id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  resulting_membership_id: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  membership_number: string;
  membership_type_id: string;
  spiritual_year_id: string;
  status: 'pending' | 'active' | 'expired' | 'suspended';
  registration_date: string;
  renewal_date: string | null;
  declaration_id: string;
  declaration_signed_at: string;
}
