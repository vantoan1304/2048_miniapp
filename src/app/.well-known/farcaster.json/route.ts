function withValidProperties(properties: Record<string, undefined | string | string[]>) {
    return Object.fromEntries(
        Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
    );
}

export async function GET() {
    const URL = process.env.NEXT_PUBLIC_URL as string;
    return Response.json({
            "accountAssociation": {
            "header": "eyJmaWQiOjIxNjM1OCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDkyMENlN2Q5NjVhYjY0OEUyNDE1NDE3NUZiMjE3NjQ3MEYxMzRhMzkifQ",
            "payload": "eyJkb21haW4iOiIyMDQ4LW1pbmlhcHAtdGhyZWUudmVyY2VsLmFwcCJ9",
            "signature": "5EQ6Tg2QcJFk8fPzzcJXhbkhp6VS5//POi0OP+duPQd1WyykABarQavPzag2Jus6xz7QozjBkn6xlPmIixFw6Bw="
  
        },
        "baseBuilder": {
            "allowedAddresses": ["0x5FbDB2315678afecb367f032d93F642f64180aa3"] // add your Base Account address here
        },
        "miniapp": {
            "version": "1",
            "name": "GMBase",
            "homeUrl": "https://2048-miniapp-three.vercel.app/",
            "iconUrl": "https://2048-miniapp-three.vercel.app/gm.png",
            "imageUrl": "https://2048-miniapp-three.vercel.app/gm.png",
            "buttonTitle": "GMBase Miniapp",
            "splashImageUrl": "https://2048-miniapp-three.vercel.app/gm.png",
            "splashBackgroundColor": "#000000",
            "webhookUrl": "https://ex.co/api/webhook",
            "subtitle": "Fast, fun, social",
            "description": "Active Base",
            "screenshotUrls": [
                "https://2048-miniapp-three.vercel.app/ss1.png",
                "https://2048-miniapp-three.vercel.app/ss2.png",
                "https://2048-miniapp-three.vercel.app/ss3.png"
            ],
            "primaryCategory": "social",
            "tags": ["example", "miniapp", "baseapp"],
            "heroImageUrl": "https://2048-miniapp-three.vercel.app/gm.png",
            "tagline": "Play instantly", 
            "ogTitle": "GMBase Miniapp",
            "ogDescription": "Active Base",
            "ogImageUrl": "https://2048-miniapp-three.vercel.app/gm.png",
            "noindex": true
        }
    }); // see the next step for the manifest_json_object
}