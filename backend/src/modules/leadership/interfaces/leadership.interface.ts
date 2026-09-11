export interface Leadership {
  id: string;
  [key: string]: unknown;
}

export interface LeadershipPosition {
  id: string;
  code: string;
  name: string;
  category: 'executive' | 'committee' | 'ministry' | 'ad_hoc';
  description: string;
  constitutional_reference: string;
  is_executive: boolean;
  requires_gender_rule?: boolean;
  active: boolean;
  display_order: number;
  responsibilities: string[];
  permissions: string[];
  constitutional_restrictions: string[];
}

export interface LeadershipAssignment {
  id: string;
  position_id: string;
  user_id: string | null;
  academic_year: string;
  assignment_type: 'permanent' | 'acting' | 'co-opted' | 'temporary';
  start_date: string;
  end_date: string;
  status: 'active' | 'vacant' | 'ended' | 'suspended';
  vacancy_reason?: string | null;
  vacancy_date?: string | null;
  notes?: string | null;
  created_at: string;
  // Joined fields:
  position_name?: string;
  position_code?: string;
  position_category?: string;
  constitutional_reference?: string;
  responsibilities?: string[];
  permissions?: string[];
  constitutional_restrictions?: string[];
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_admission_number?: string;
  user_course?: string;
  user_year?: number | string;
}

export interface LeaderResponsibilitiesView {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    admission_number: string;
  };
  positions: LeadershipAssignment[];
  all_responsibilities: string[];
  permissions: string[];
  constitutional_restrictions: string[];
  pending_attention: {
    membership_applications: number;
    leadership_vacancies: number;
    meetings_awaiting_minutes: number;
    finance_awaiting_action: number;
  };
}

