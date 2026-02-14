const axios = require('axios');
const fs = require('fs');

const workdayCandidates = [
    { name: 'Logitech', tenant: 'logitech', site: 'Logitech_External_Careers' },
    { name: 'Cisco', tenant: 'cisco', site: 'Cisco' }, // Retrying standard
    { name: 'Cisco', tenant: 'cisco', site: 'External' },
    { name: 'AMD', tenant: 'amd', site: 'AMDCareers' },
    { name: 'HPE', tenant: 'hpe', site: 'HPE_Careers' },
    { name: 'HPE', tenant: 'hpe', site: 'External' }
];

async function checkWorkday() {
    console.log('--- Checking Workday Candidates (Round 2) ---');
    const hosts = ['wd1', 'wd3', 'wd5', 'wd12', 'myworkdayjobs'];
    const results = [];

    for (const company of workdayCandidates) {
        let success = false;
        for (const host of hosts) {
            const url = `https://${company.tenant}.${host}.myworkdayjobs.com/wday/cxs/${company.tenant}/${company.site}/jobs`;
            try {
                const payload = { "appliedFacets": {}, "limit": 1, "offset": 0, "searchText": "" };
                await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                    timeout: 4000
                });
                console.log(`✅ ${company.name} (${company.tenant}): Success on ${host}!`);
                results.push({ ...company, host });
                success = true;
                break;
            } catch (e) {
                // Silent
            }
        }
        if (!success) {
            console.log(`❌ ${company.name} (${company.tenant}): Failed`);
        }
    }

    fs.writeFileSync('workday_verify_results_2.json', JSON.stringify(results, null, 2));
}

checkWorkday();
