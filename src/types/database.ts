export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type FirmRole = "admin" | "lawyer" | "paralegal" | "read_only";
export type MembershipStatus = "invited" | "active" | "disabled";
export type CaseStatus = "open" | "closed" | "archived";
export type TaskStatus = "open" | "completed" | "archived";
export type ReminderChannel = "in_app" | "email";
export type NotificationAlertWindow =
  "seven_day" | "forty_eight_hour" | "twenty_four_hour";
export type NotificationDeliveryStatus = "pending" | "sent" | "failed" | "skipped";
export type NotificationScheduleItemKind = "deadline" | "task";

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: string;
          firm_id: string;
          actor_profile_id: string | null;
          action: string;
          target_table: string;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          firm_id: string;
          actor_profile_id?: string | null;
          action: string;
          target_table: string;
          target_id?: string | null;
          metadata?: Json;
        };
        Update: never;
        Relationships: [];
      };
      case_deadlines: {
        Row: {
          id: string;
          firm_id: string;
          case_id: string;
          title: string;
          due_on: string;
          rule_source: string | null;
          calculation_notes: string | null;
          confirmed_by: string | null;
          confirmed_at: string | null;
          created_by: string;
          created_at: string;
          hidden_at: string | null;
          hidden_by: string | null;
          updated_at: string;
        };
        Insert: {
          firm_id: string;
          case_id: string;
          title: string;
          due_on: string;
          rule_source?: string | null;
          calculation_notes?: string | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_by: string;
          hidden_at?: string | null;
          hidden_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["case_deadlines"]["Insert"]>;
        Relationships: [];
      };
      case_members: {
        Row: {
          id: string;
          firm_id: string;
          case_id: string;
          profile_id: string;
          role: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          firm_id: string;
          case_id: string;
          profile_id: string;
          role: string;
          assigned_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["case_members"]["Insert"]>;
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          firm_id: string;
          client_id: string;
          case_number: string;
          title: string;
          status: CaseStatus;
          jurisdiction: string | null;
          court: string | null;
          docket_number: string | null;
          opened_on: string;
          closed_on: string | null;
          description: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          firm_id: string;
          client_id: string;
          case_number: string;
          title: string;
          status?: CaseStatus;
          jurisdiction?: string | null;
          court?: string | null;
          docket_number?: string | null;
          opened_on: string;
          closed_on?: string | null;
          description?: string | null;
          created_by: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          firm_id: string;
          display_name: string;
          identity_reference: string | null;
          status: string;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          firm_id: string;
          display_name: string;
          identity_reference?: string | null;
          status?: string;
          created_by: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          firm_id: string;
          case_id: string;
          title: string;
          description: string | null;
          starts_at: string;
          ends_at: string | null;
          timezone: string;
          location: string | null;
          created_by: string;
          created_at: string;
          hidden_at: string | null;
          hidden_by: string | null;
          updated_at: string;
        };
        Insert: {
          firm_id: string;
          case_id: string;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at?: string | null;
          timezone: string;
          location?: string | null;
          created_by: string;
          hidden_at?: string | null;
          hidden_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      firm_memberships: {
        Row: {
          id: string;
          firm_id: string;
          profile_id: string;
          role: FirmRole;
          status: MembershipStatus;
          invited_by: string | null;
          invited_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          firm_id: string;
          profile_id: string;
          role: FirmRole;
          status?: MembershipStatus;
          invited_by?: string | null;
          accepted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["firm_memberships"]["Insert"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          archived_at: string | null;
          case_id: string;
          created_at: string;
          created_by: string;
          display_name: string;
          firm_id: string;
          id: string;
          mime_type: string | null;
          size_bytes: number | null;
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          case_id: string;
          created_by: string;
          display_name: string;
          firm_id: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          storage_bucket?: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      firms: {
        Row: {
          id: string;
          name: string;
          default_timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          default_timezone?: string;
        };
        Update: Partial<Database["public"]["Tables"]["firms"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string;
          mfa_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email: string;
          mfa_required?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      notes: {
        Row: {
          archived_at: string | null;
          body: string;
          case_id: string;
          created_at: string;
          created_by: string;
          firm_id: string;
          id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          archived_at?: string | null;
          body: string;
          case_id: string;
          created_by: string;
          firm_id: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
        Relationships: [];
      };
      notification_deliveries: {
        Row: {
          alert_window: NotificationAlertWindow;
          attempt_count: number;
          case_id: string;
          channel: ReminderChannel;
          created_at: string;
          firm_id: string;
          id: string;
          last_error: string | null;
          provider: "resend";
          provider_message_id: string | null;
          recipient_email: string;
          recipient_profile_id: string;
          schedule_item_id: string;
          schedule_item_kind: NotificationScheduleItemKind;
          sent_at: string | null;
          status: NotificationDeliveryStatus;
          updated_at: string;
        };
        Insert: {
          alert_window: NotificationAlertWindow;
          attempt_count?: number;
          case_id: string;
          channel?: ReminderChannel;
          firm_id: string;
          last_error?: string | null;
          provider?: "resend";
          provider_message_id?: string | null;
          recipient_email: string;
          recipient_profile_id: string;
          schedule_item_id: string;
          schedule_item_kind: NotificationScheduleItemKind;
          sent_at?: string | null;
          status?: NotificationDeliveryStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_deliveries"]["Insert"]
        >;
        Relationships: [];
      };
      reminders: {
        Row: {
          case_id: string;
          channel: ReminderChannel;
          created_at: string;
          created_by: string;
          deadline_id: string | null;
          event_id: string | null;
          firm_id: string;
          id: string;
          remind_at: string;
          task_id: string | null;
        };
        Insert: {
          case_id: string;
          channel?: ReminderChannel;
          created_by: string;
          deadline_id?: string | null;
          event_id?: string | null;
          firm_id: string;
          remind_at: string;
          task_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          case_id: string;
          created_at: string;
          created_by: string;
          due_on: string | null;
          firm_id: string;
          id: string;
          status: TaskStatus;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          case_id: string;
          created_by: string;
          due_on?: string | null;
          firm_id: string;
          status?: TaskStatus;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      archive_case: {
        Args: {
          p_case_id: string;
        };
        Returns: void;
      };
      create_case_event: {
        Args: {
          p_case_id: string;
          p_description?: string | null;
          p_ends_at_local?: string | null;
          p_location?: string | null;
          p_starts_at_local: string;
          p_timezone: string;
          p_title: string;
        };
        Returns: string;
      };
      create_case_with_client: {
        Args: {
          p_case_number: string;
          p_client_display_name: string;
          p_court?: string | null;
          p_description?: string | null;
          p_docket_number?: string | null;
          p_firm_id: string;
          p_jurisdiction?: string | null;
          p_opened_on: string;
          p_title: string;
        };
        Returns: string;
      };
      create_legal_deadline: {
        Args: {
          p_calculation_notes?: string | null;
          p_case_id: string;
          p_due_on: string;
          p_rule_source?: string | null;
          p_title: string;
        };
        Returns: string;
      };
      hide_schedule_item: {
        Args: {
          p_item_id: string;
          p_item_kind: string;
        };
        Returns: void;
      };
    };
    Enums: {
      case_status: CaseStatus;
      firm_role: FirmRole;
      membership_status: MembershipStatus;
      reminder_channel: ReminderChannel;
      task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
