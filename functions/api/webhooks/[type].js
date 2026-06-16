export async function onRequestPost(context) {
    const { request, env, params } = context;
    const type = params.type; 

    let webhookUrl = '';
    switch(type) {
        case 'duty_in': webhookUrl = env.WEBHOOK_DUTY_CLOCK_IN; break;
        case 'duty_out': webhookUrl = env.WEBHOOK_DUTY_CLOCK_OUT; break;
        case 'duty_leave': webhookUrl = env.WEBHOOK_DUTY_LEAVE; break;
        case 'duty_resign': webhookUrl = env.WEBHOOK_DUTY_RESIGN; break;
        case 'edit_org': webhookUrl = env.WEBHOOK_EDIT_ORG; break;
        case 'general': webhookUrl = env.WEBHOOK_GENERAL_SERVICE; break;
        case 'register_org': webhookUrl = env.WEBHOOK_REGISTER_ORG; break;
        case 'welfare': webhookUrl = env.WEBHOOK_WELFARE; break;
        case 'welfare_trade': webhookUrl = env.WEBHOOK_WELFARE_TRADE; break;
        default: 
            return new Response(JSON.stringify({ error: 'Invalid webhook type' }), { status: 400 });
    }

    if (!webhookUrl) {
        return new Response(JSON.stringify({ error: 'Webhook URL not configured in Secrets' }), { status: 500 });
    }

    try {
        const contentType = request.headers.get('Content-Type') || '';
        let body;
        
        if (contentType.includes('multipart/form-data')) {
            body = await request.formData();
        } else {
            body = await request.text();
        }

        const discordResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: contentType.includes('multipart/form-data') ? undefined : { 'Content-Type': contentType },
            body: body
        });

        if (discordResponse.ok) {
            return new Response(JSON.stringify({ success: true }), { headers: {'Content-Type': 'application/json'} });
        } else {
            const errText = await discordResponse.text();
            console.error("Discord error:", discordResponse.status, errText);
            return new Response(JSON.stringify({ error: 'Discord webhook failed', details: errText }), { 
                status: discordResponse.status, 
                headers: {'Content-Type': 'application/json'} 
            });
        }
    } catch (err) {
        console.error("Proxy error:", err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500, 
            headers: {'Content-Type': 'application/json'} 
        });
    }
}
