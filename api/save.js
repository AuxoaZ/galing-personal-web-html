/**
 * Vercel Serverless Function to securely save content to GitHub
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { password, content, owner, repo } = req.body;

    // 1. Verify Password
    if (password !== 'admin321') {
        return res.status(401).json({ message: 'Invalid Access Key' });
    }

    // 2. Get GitHub Token from ENV
    const token = process.env.GH_TOKEN;
    if (!token) {
        return res.status(500).json({ message: 'GitHub Token not configured in Vercel ENV' });
    }

    const path = 'content.json';
    const branch = 'main';

    try {
        // 3. Get current SHA of the file
        const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const infoRes = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (!infoRes.ok) {
            const errBody = await infoRes.json();
            return res.status(infoRes.status).json({ message: 'GitHub Fetch Error: ' + errBody.message });
        }

        const { sha } = await infoRes.json();

        // 4. Update the file
        const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const body = {
            message: 'Admin: Manual update via Dashboard',
            content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
            sha: sha,
            branch: branch
        };

        const putRes = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const result = await putRes.json();

        if (putRes.ok) {
            return res.status(200).json({ message: 'Success', result });
        } else {
            return res.status(putRes.status).json({ message: 'GitHub Update Error: ' + result.message });
        }
    } catch (error) {
        console.error('Serverless Error:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
