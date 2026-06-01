const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    const { slug } = req.query;
    const API_BASE_URL = "https://paste.warungmezur.workers.dev";
    const FRONTEND_URL = "https://paste.warungmezur.web.id";

    let title = "Paste Tidak Ditemukan - Warung Mezur Paste";
    let description = "Paste yang kamu cari tidak ditemukan.";

    if (slug) {
        try {
            const apiRes = await fetch(`${API_BASE_URL}/api/pastes/${slug}`);
            const data = await apiRes.json();

            if (data.success) {
                const paste = data.data;
                title = `${paste.title || 'Untitled'} - Warung Mezur Paste`;
                description = `Paste ${paste.syntax || 'text'} di Warung Mezur Paste.`;
            } else if (data.private) {
                const paste = data.data;
                title = `${paste?.title || 'Private Paste'} - Private Paste`;
                description = "Paste private. Masukkan password untuk membuka.";
            } else if (data.expired) {
                title = "Paste Expired - Warung Mezur Paste";
                description = "Paste ini sudah expired dan tidak bisa dibuka.";
            }
        } catch (err) {
            // Biarkan menggunakan title / description fallback jika request API bermasalah
        }
    }

    // Load file index.html asli dari disk Vercel build
    const htmlPath = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Helper sederhana untuk escape string HTML guna mencegah breaking tag & XSS
    const escapeHtml = (text) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);

    const ogImage = "https://cdn.prod.website-files.com/60ef088dd8fef99352abb434/647cee089d14eeafc9af9996_Meta%20Tags%20For%20SEO%20-%20A%20Complete%20Guide%20For%20Beginners-100-p-1080.webp";

// Meta tag lengkap untuk visual share WhatsApp, Telegram, Twitter, Facebook, dsb.
const metaTags = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${FRONTEND_URL}/p/${slug}">
    <meta property="og:site_name" content="Warung Mezur Paste">
    
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:secure_url" content="${ogImage}">
    <meta property="og:image:type" content="image/webp">
    <meta property="og:image:width" content="1080">
    <meta property="og:image:height" content="567">
    <meta property="og:image:alt" content="${safeTitle}">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${ogImage}">
    
    <meta name="theme-color" content="#38bdf8">
    <link rel="canonical" href="${FRONTEND_URL}/p/${slug}">
`;

    // Ganti tag default <title> pada index.html dengan kumpulan dynamic meta tags kita
    html = html.replace(/<title>[^<]*<\/title>/i, metaTags);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}
