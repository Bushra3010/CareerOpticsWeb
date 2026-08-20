/**
 * Supabase schema types.
 *
 * Hand-authored to match supabase/migrations/0001_init.sql so the app is typed
 * before a Supabase project exists. Once the project is linked, regenerate and
 * overwrite this file rather than editing it:
 *
 *   pnpm db:types    # supabase gen types typescript --linked
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      states: {
        Row: { id: string; name: string; slug: string };
        Insert: { id?: string; name: string; slug: string };
        Update: { id?: string; name?: string; slug?: string };
        Relationships: [];
      };
      cities: {
        Row: { id: string; state_id: string | null; name: string; slug: string };
        Insert: {
          id?: string;
          state_id?: string | null;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          state_id?: string | null;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey";
            columns: ["state_id"];
            isOneToOne: false;
            referencedRelation: "states";
            referencedColumns: ["id"];
          },
        ];
      };
      streams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          sort_order: number | null;
          is_featured: boolean | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number | null;
          is_featured?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number | null;
          is_featured?: boolean | null;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          short_name: string | null;
          slug: string;
          stream_id: string | null;
          level: Database["public"]["Enums"]["level_enum"];
          duration_months: number | null;
          eligibility: string | null;
          description: string | null;
          avg_fee_min: number | null;
          avg_fee_max: number | null;
          career_scope: string | null;
          is_featured: boolean | null;
          status: Database["public"]["Enums"]["content_status"] | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          short_name?: string | null;
          slug: string;
          stream_id?: string | null;
          level: Database["public"]["Enums"]["level_enum"];
          duration_months?: number | null;
          eligibility?: string | null;
          description?: string | null;
          avg_fee_min?: number | null;
          avg_fee_max?: number | null;
          career_scope?: string | null;
          is_featured?: boolean | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string | null;
          slug?: string;
          stream_id?: string | null;
          level?: Database["public"]["Enums"]["level_enum"];
          duration_months?: number | null;
          eligibility?: string | null;
          description?: string | null;
          avg_fee_min?: number | null;
          avg_fee_max?: number | null;
          career_scope?: string | null;
          is_featured?: boolean | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: false;
            referencedRelation: "streams";
            referencedColumns: ["id"];
          },
        ];
      };
      colleges: {
        Row: {
          id: string;
          name: string;
          slug: string;
          short_name: string | null;
          city_id: string | null;
          address: string | null;
          type: Database["public"]["Enums"]["college_type"] | null;
          established_year: number | null;
          naac_grade: string | null;
          nirf_rank: number | null;
          approvals: string[] | null;
          logo_url: string | null;
          cover_url: string | null;
          brochure_url: string | null;
          highest_package: number | null;
          average_package: number | null;
          total_students: number | null;
          campus_size: string | null;
          facilities: string[] | null;
          about: string | null;
          admission_process: string | null;
          why_choose: string | null;
          rating: number | null;
          review_count: number | null;
          lat: number | null;
          lng: number | null;
          website: string | null;
          is_featured: boolean | null;
          status: Database["public"]["Enums"]["content_status"] | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          short_name?: string | null;
          city_id?: string | null;
          address?: string | null;
          type?: Database["public"]["Enums"]["college_type"] | null;
          established_year?: number | null;
          naac_grade?: string | null;
          nirf_rank?: number | null;
          approvals?: string[] | null;
          logo_url?: string | null;
          cover_url?: string | null;
          brochure_url?: string | null;
          highest_package?: number | null;
          average_package?: number | null;
          total_students?: number | null;
          campus_size?: string | null;
          facilities?: string[] | null;
          about?: string | null;
          admission_process?: string | null;
          why_choose?: string | null;
          rating?: number | null;
          review_count?: number | null;
          lat?: number | null;
          lng?: number | null;
          website?: string | null;
          is_featured?: boolean | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          short_name?: string | null;
          city_id?: string | null;
          address?: string | null;
          type?: Database["public"]["Enums"]["college_type"] | null;
          established_year?: number | null;
          naac_grade?: string | null;
          nirf_rank?: number | null;
          approvals?: string[] | null;
          logo_url?: string | null;
          cover_url?: string | null;
          brochure_url?: string | null;
          highest_package?: number | null;
          average_package?: number | null;
          total_students?: number | null;
          campus_size?: string | null;
          facilities?: string[] | null;
          about?: string | null;
          admission_process?: string | null;
          why_choose?: string | null;
          rating?: number | null;
          review_count?: number | null;
          lat?: number | null;
          lng?: number | null;
          website?: string | null;
          is_featured?: boolean | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "colleges_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      college_courses: {
        Row: {
          id: string;
          college_id: string | null;
          course_id: string | null;
          fee_per_year: number | null;
          total_fee: number | null;
          duration_months: number | null;
          seats: number | null;
          eligibility: string | null;
        };
        Insert: {
          id?: string;
          college_id?: string | null;
          course_id?: string | null;
          fee_per_year?: number | null;
          total_fee?: number | null;
          duration_months?: number | null;
          seats?: number | null;
          eligibility?: string | null;
        };
        Update: {
          id?: string;
          college_id?: string | null;
          course_id?: string | null;
          fee_per_year?: number | null;
          total_fee?: number | null;
          duration_months?: number | null;
          seats?: number | null;
          eligibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "college_courses_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "college_courses_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      college_gallery: {
        Row: {
          id: string;
          college_id: string | null;
          image_url: string | null;
          caption: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          college_id?: string | null;
          image_url?: string | null;
          caption?: string | null;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          college_id?: string | null;
          image_url?: string | null;
          caption?: string | null;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "college_gallery_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
        ];
      };
      exams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          conducting_body: string | null;
          level: Database["public"]["Enums"]["level_enum"] | null;
          mode: string | null;
          exam_date: string | null;
          application_start: string | null;
          application_end: string | null;
          eligibility: string | null;
          pattern: string | null;
          syllabus: string | null;
          official_url: string | null;
          status: Database["public"]["Enums"]["content_status"] | null;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          conducting_body?: string | null;
          level?: Database["public"]["Enums"]["level_enum"] | null;
          mode?: string | null;
          exam_date?: string | null;
          application_start?: string | null;
          application_end?: string | null;
          eligibility?: string | null;
          pattern?: string | null;
          syllabus?: string | null;
          official_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          conducting_body?: string | null;
          level?: Database["public"]["Enums"]["level_enum"] | null;
          mode?: string | null;
          exam_date?: string | null;
          application_start?: string | null;
          application_end?: string | null;
          eligibility?: string | null;
          pattern?: string | null;
          syllabus?: string | null;
          official_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Relationships: [];
      };
      exam_courses: {
        Row: { exam_id: string; course_id: string };
        Insert: { exam_id: string; course_id: string };
        Update: { exam_id?: string; course_id?: string };
        Relationships: [
          {
            foreignKeyName: "exam_courses_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_courses_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          city: string | null;
          country_code: string | null;
          level: Database["public"]["Enums"]["level_enum"] | null;
          course_id: string | null;
          college_id: string | null;
          message: string | null;
          source: string;
          page_url: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          status: Database["public"]["Enums"]["lead_status"] | null;
          assigned_to: string | null;
          answers: Json | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          city?: string | null;
          country_code?: string | null;
          level?: Database["public"]["Enums"]["level_enum"] | null;
          course_id?: string | null;
          college_id?: string | null;
          message?: string | null;
          source: string;
          page_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          status?: Database["public"]["Enums"]["lead_status"] | null;
          assigned_to?: string | null;
          answers?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          city?: string | null;
          country_code?: string | null;
          level?: Database["public"]["Enums"]["level_enum"] | null;
          course_id?: string | null;
          college_id?: string | null;
          message?: string | null;
          source?: string;
          page_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          status?: Database["public"]["Enums"]["lead_status"] | null;
          assigned_to?: string | null;
          answers?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string | null;
          user_id: string | null;
          action: string | null;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          user_id?: string | null;
          action?: string | null;
          note?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          user_id?: string | null;
          action?: string | null;
          note?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      finder_sessions: {
        Row: {
          id: string;
          session_id: string | null;
          step: number | null;
          answers: Json | null;
          lead_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          step?: number | null;
          answers?: Json | null;
          lead_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          step?: number | null;
          answers?: Json | null;
          lead_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "finder_sessions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          cover_url: string | null;
          category: string | null;
          tags: string[] | null;
          author: string | null;
          read_minutes: number | null;
          published_at: string | null;
          status: Database["public"]["Enums"]["content_status"] | null;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string | null;
          cover_url?: string | null;
          category?: string | null;
          tags?: string[] | null;
          author?: string | null;
          read_minutes?: number | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string | null;
          cover_url?: string | null;
          category?: string | null;
          tags?: string[] | null;
          author?: string | null;
          read_minutes?: number | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Relationships: [];
      };
      news: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          cover_url: string | null;
          category: string | null;
          tags: string[] | null;
          author: string | null;
          read_minutes: number | null;
          published_at: string | null;
          status: Database["public"]["Enums"]["content_status"] | null;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string | null;
          cover_url?: string | null;
          category?: string | null;
          tags?: string[] | null;
          author?: string | null;
          read_minutes?: number | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string | null;
          cover_url?: string | null;
          category?: string | null;
          tags?: string[] | null;
          author?: string | null;
          read_minutes?: number | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Relationships: [];
      };
      guides: {
        Row: {
          id: string;
          title: string;
          slug: string;
          level: Database["public"]["Enums"]["level_enum"] | null;
          content: string | null;
          cover_url: string | null;
          status: Database["public"]["Enums"]["content_status"] | null;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          level?: Database["public"]["Enums"]["level_enum"] | null;
          content?: string | null;
          cover_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          level?: Database["public"]["Enums"]["level_enum"] | null;
          content?: string | null;
          cover_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          student_name: string;
          photo_url: string | null;
          company: string | null;
          package_lpa: number | null;
          course: string | null;
          city: string | null;
          college_id: string | null;
          quote: string | null;
          sort_order: number | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          student_name: string;
          photo_url?: string | null;
          company?: string | null;
          package_lpa?: number | null;
          course?: string | null;
          city?: string | null;
          college_id?: string | null;
          quote?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          student_name?: string;
          photo_url?: string | null;
          company?: string | null;
          package_lpa?: number | null;
          course?: string | null;
          city?: string | null;
          college_id?: string | null;
          quote?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "testimonials_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery: {
        Row: {
          id: string;
          image_url: string;
          caption: string | null;
          event_date: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: string | null;
          event_date?: string | null;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          image_url?: string;
          caption?: string | null;
          event_date?: string | null;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      press_releases: {
        Row: {
          id: string;
          publication: string;
          image_url: string | null;
          article_url: string | null;
          published_on: string | null;
        };
        Insert: {
          id?: string;
          publication: string;
          image_url?: string | null;
          article_url?: string | null;
          published_on?: string | null;
        };
        Update: {
          id?: string;
          publication?: string;
          image_url?: string | null;
          article_url?: string | null;
          published_on?: string | null;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          title: string | null;
          image_url: string | null;
          image_mobile_url: string | null;
          cta_text: string | null;
          cta_url: string | null;
          sort_order: number | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          image_url?: string | null;
          image_mobile_url?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          image_url?: string | null;
          image_mobile_url?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          scope: string | null;
          ref_id: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          scope?: string | null;
          ref_id?: string | null;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          scope?: string | null;
          ref_id?: string | null;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          college_id: string | null;
          name: string | null;
          email: string | null;
          course: string | null;
          rating: number | null;
          title: string | null;
          body: string | null;
          is_approved: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          college_id?: string | null;
          name?: string | null;
          email?: string | null;
          course?: string | null;
          rating?: number | null;
          title?: string | null;
          body?: string | null;
          is_approved?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          college_id?: string | null;
          name?: string | null;
          email?: string | null;
          course?: string | null;
          rating?: number | null;
          title?: string | null;
          body?: string | null;
          is_approved?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
        ];
      };
      scholarships: {
        Row: {
          id: string;
          title: string;
          slug: string;
          state: string | null;
          content: string | null;
          image_url: string | null;
          status: Database["public"]["Enums"]["content_status"] | null;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          state?: string | null;
          content?: string | null;
          image_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          state?: string | null;
          content?: string | null;
          image_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          phone: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          phone?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          phone?: string | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      settings: {
        Row: { key: string; value: Json | null };
        Insert: { key: string; value?: Json | null };
        Update: { key?: string; value?: Json | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      level_enum:
        | "after_10"
        | "after_12"
        | "ug"
        | "pg"
        | "diploma"
        | "doctorate"
        | "certificate";
      college_type:
        | "private"
        | "government"
        | "deemed"
        | "autonomous"
        | "state"
        | "central";
      lead_status:
        | "new"
        | "contacted"
        | "interested"
        | "visit_scheduled"
        | "admitted"
        | "dropped"
        | "junk";
      content_status: "draft" | "published" | "archived";
      user_role:
        | "super_admin"
        | "editor"
        | "counsellor"
        // CRM roles, added by 0005_crm_roles.sql
        | "telecaller"
        | "backend"
        | "finance";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
