/**
 * ===========================================================================
 * Google Apps Script — Portfolio Contact Form Email Automation
 * ===========================================================================
 * 
 * Target Email: akshay123modi@gmail.com
 * 
 * HOW TO SET THIS UP (Takes ~2 minutes, 100% Free):
 * --------------------------------------------------
 * 1. Go to https://script.google.com and click "+ New project".
 * 2. Delete any existing code in Code.gs and paste ALL the code below.
 * 3. Click "Deploy" (top right button) -> select "New deployment".
 * 4. Click the gear icon next to "Select type" -> choose "Web app".
 * 5. Configure:
 *      - Description: "Portfolio Contact Form Automation"
 *      - Execute as: "Me" (your Google account)
 *      - Who has access: "Anyone"   <--- (IMPORTANT: choose "Anyone" so your website can trigger it)
 * 6. Click "Deploy", review permissions, and sign in with your Google account.
 * 7. Copy the "Web app URL" (it starts with: https://script.google.com/macros/s/.../exec).
 * 8. Open your Portfolio Admin Dashboard (http://localhost:8080/admin) -> go to "Messages & Email",
 *    paste the URL into the "Google Apps Script Webhook URL" field, and click "Save & Test".
 * 
 * DONE! Every time someone submits your contact form, you will receive an instant,
 * beautifully formatted email in your Gmail inbox with their name, email, subject,
 * message, and a 1-click "Reply to Visitor" button!
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No postData contents received."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var toEmail = "akshay123modi@gmail.com";
    var senderName = (data.name || "Portfolio Visitor").toString().trim();
    var senderEmail = (data.email || "no-reply@example.com").toString().trim();
    var messageSubject = (data.subject || "Portfolio Inquiry").toString().trim();
    var messageBody = (data.message || "(No message provided)").toString().trim();
    var timestampStr = data.timestamp 
      ? new Date(data.timestamp).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) + " IST"
      : new Date().toLocaleString();

    var emailSubject = "📬 New Portfolio Message: " + messageSubject + " (from " + senderName + ")";

    // Styled responsive HTML email body with Obsidian / Violet / Cyan aesthetic
    var htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #0c081c; color: #f8fafc; border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 26px 24px; text-align: left;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;">New Portfolio Inquiry</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); font-family: monospace;">Received from akshaymodi.dev contact form</p>
        </div>

        <!-- Details Card -->
        <div style="padding: 26px 24px;">
          <div style="background-color: #140f26; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 18px; margin-bottom: 22px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; width: 90px; font-weight: 600;">Sender:</td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${escapeHtml(senderName)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Email:</td>
                <td style="padding: 6px 0;"><a href="mailto:${escapeHtml(senderEmail)}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">${escapeHtml(senderEmail)}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Subject:</td>
                <td style="padding: 6px 0; color: #e2e8f0;">${escapeHtml(messageSubject)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Date:</td>
                <td style="padding: 6px 0; color: #cbd5e1; font-size: 13px; font-family: monospace;">${timestampStr}</td>
              </tr>
            </table>
          </div>

          <!-- Message Body -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c084fc; margin-bottom: 8px;">Message Content</div>
            <div style="background-color: #17112e; border-left: 3px solid #06b6d4; border-radius: 8px; padding: 18px; color: #f8fafc; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(messageBody)}</div>
          </div>

          <!-- Action Button: 1-Click Reply -->
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="mailto:${escapeHtml(senderEmail)}?subject=Re: ${encodeURIComponent(messageSubject)}" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 8px 20px rgba(168,85,247,0.35);">
              ✉️ Reply to ${escapeHtml(senderName)}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #080514; border-top: 1px solid rgba(255,255,255,0.06); padding: 14px 24px; text-align: center; font-size: 12px; color: #64748b; font-family: monospace;">
          Akshay Kumar Modi Portfolio • Google Apps Script Email Automation
        </div>
      </div>
    `;

    // Plain text alternative
    var plainTextBody = [
      "New Portfolio Message",
      "======================",
      "Sender: " + senderName,
      "Email: " + senderEmail,
      "Subject: " + messageSubject,
      "Date: " + timestampStr,
      "",
      "Message:",
      messageBody,
      "",
      "To reply, send email to: " + senderEmail
    ].join("\n");

    // Send the email via Gmail / MailApp
    MailApp.sendEmail({
      to: toEmail,
      subject: emailSubject,
      body: plainTextBody,
      htmlBody: htmlBody,
      replyTo: senderEmail,
      name: "Portfolio (" + senderName + ")"
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Notification email sent successfully to " + toEmail,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Health check endpoint for testing in browser or curl
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Portfolio Contact Form Automation",
    targetEmail: "akshay123modi@gmail.com",
    instructions: "Send a POST request with JSON { name, email, subject, message } to trigger email."
  })).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

