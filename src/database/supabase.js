// Supabase configuration
const SUPABASE_URL = 'https://hefwckcjntblrfidwpqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZndya2NqbnRibHJmaWR3cHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODE3ODAsImV4cCI6MjA3OTA1Nzc4MH0.ue-9QEBK9H0uhYBcpMsHPMOXHTXE_hlu6CAdl1l-gnA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class DatabaseService {
    // User authentication
    async authenticateUser(username, password) {
        try {
            // In a real app, you'd use Supabase Auth
            // This is a simplified version for demo
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();

            if (error) throw error;
            
            // Simple password check (in production, use proper hashing)
            if (data && data.password_hash.includes(password)) {
                return { success: true, user: data };
            }
            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    // Dashboard data
    async getDashboardData() {
        try {
            const { data, error } = await supabase
                .from('dashboard_data')
                .select('*')
                .order('cluster');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return [];
        }
    }

    // Activation data
    async getActivationData(category, filters = {}) {
        try {
            let tableName;
            switch (category) {
                case 'sgs': tableName = 'sgs_activations'; break;
                case 'sds': tableName = 'sds_activations'; break;
                case 'retail': tableName = 'retail_activations'; break;
                default: return [];
            }

            let query = supabase.from(tableName).select('*');

            if (filters.subCluster && filters.subCluster !== 'all') {
                query = query.eq('sub_cluster', filters.subCluster);
            }

            if (filters.search) {
                query = query.or(`nama.ilike.%${filters.search}%,nik.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Error fetching ${category} data:`, error);
            return [];
        }
    }

    // Save uploaded data
    async saveUploadedData(data) {
        try {
            // Save dashboard data
            for (const item of data.dashboard) {
                const { error } = await supabase
                    .from('dashboard_data')
                    .upsert(item, { onConflict: 'cluster' });
                
                if (error) throw error;
            }

            // Save activation data
            await this.saveActivationData('sgs_activations', data.activationDetail.sgs);
            await this.saveActivationData('sds_activations', data.activationDetail.sds);
            await this.saveActivationData('retail_activations', data.activationDetail.retail);

            return { success: true };
        } catch (error) {
            console.error('Error saving uploaded data:', error);
            return { success: false, error: error.message };
        }
    }

    async saveActivationData(table, data) {
        if (!data || data.length === 0) return;

        // Clear existing data
        const { error: deleteError } = await supabase.from(table).delete().neq('id', '');
        if (deleteError) throw deleteError;

        // Insert new data
        const { error } = await supabase.from(table).insert(data);
        if (error) throw error;
    }
}

// Export singleton instance
window.dbService = new DatabaseService();