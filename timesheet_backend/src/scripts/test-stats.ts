import axios from 'axios';

async function test() {
    try {
        const login = await axios.post('http://localhost:3000/auth/login', {
            email: 'admin@example.com',
            password: 'password'
        });
        const token = login.data.access_token;
        
        const stats = await axios.get('http://localhost:3000/admin/reports/stats?timeGrouping=day&groupBy[]=project', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Stats Output:', JSON.stringify(stats.data, null, 2));
    } catch (e) {
        console.error('Test Failed:', e.response?.data || e.message);
    }
}

test();
