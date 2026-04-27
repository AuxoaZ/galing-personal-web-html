/**
 * Vercel Serverless Function to securely save content and upload files to GitHub
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { password, content, cvFile, imageFile, owner, repo } = req.body;

    // 1. Verify Password
    if (password !== 'admin321') {
        return res.status(401).json({ message: 'Invalid Access Key' });
    }

    const token = process.env.GH_TOKEN;
    if (!token) {
        return res.status(500).json({ message: 'GitHub Token not configured in Vercel ENV' });
    }

    try {
        const results = [];

        // --- TASK 1: Update content.json ---
        const contentPath = 'content.json';
        const infoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${contentPath}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (infoRes.ok) {
            const { sha } = await infoRes.json();
            const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${contentPath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Admin: Update website content',
                    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
                    sha: sha,
                    branch: 'main'
                })
            });
            results.push({ file: 'content.json', status: updateRes.status });
        }

        // --- TASK 2: Update CV PDF (if provided) ---
        if (cvFile) {
            const pdfPath = content.profile.cv_path || 'assets/pdf/Zhe_Fu_CV.pdf';
            await uploadToGithub(owner, repo, pdfPath, cvFile, 'Admin: Update CV PDF', token, results);
        }

        // --- TASK 3: Update Profile Image (if provided) ---
        if (imageFile) {
            const imgPath = 'assets/img/profile.jpg'; // Always upload to a static path
            // Update the JSON to point to this path if it doesn't already
            content.profile.image = imgPath; 
            await uploadToGithub(owner, repo, imgPath, imageFile, 'Admin: Update Profile Image', token, results);
        }

        return res.status(200).json({ message: 'Process completed', details: results });

    } catch (error) {
        console.error('Serverless Error:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

async function uploadToGithub(owner, repo, path, base64Content, message, token, results) {
    const infoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}` }
    });

    let sha = null;
    if (infoRes.ok) {
        const data = await infoRes.json();
        sha = data.sha;
    }

    const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            content: base64Content,
            sha: sha,
            branch: 'main'
        })
    });
    results.push({ file: path, status: updateRes.status });
}
