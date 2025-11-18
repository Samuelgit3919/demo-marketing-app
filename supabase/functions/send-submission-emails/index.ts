import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  clientEmail: string;
  clientName: string;
  adminEmail: string;
  submissionData: {
    fullName: string;
    email: string;
    phone?: string;
    postalCode: string;
    spaces: any[];
    storagePriorities: string[];
    additionalNotes: string;
    meetingDate?: string;
    meetingLink?: string;
    meetingPlatform?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, adminEmail, submissionData }: EmailRequest = await req.json();

    console.log("Sending emails for submission from:", clientEmail);

    // Send confirmation email to client
    const meetingDateTime = submissionData.meetingDate 
      ? new Date(submissionData.meetingDate).toLocaleString('en-US', { 
          dateStyle: 'full', 
          timeStyle: 'short' 
        })
      : null;

    const clientEmailResponse = await resend.emails.send({
      from: "Design & Supply <onboarding@resend.dev>",
      to: [clientEmail],
      subject: "Thank you for your submission!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Thank You, ${clientName}!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            We've received your design consultation request and are excited to work with you!
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Your Submission Details</h2>
            <p><strong>Name:</strong> ${submissionData.fullName}</p>
            <p><strong>Email:</strong> ${submissionData.email}</p>
            ${submissionData.phone ? `<p><strong>Phone:</strong> ${submissionData.phone}</p>` : ''}
            <p><strong>Postal Code:</strong> ${submissionData.postalCode}</p>
            <p><strong>Spaces:</strong> ${submissionData.spaces.length} space(s)</p>
            ${submissionData.additionalNotes ? `<p><strong>Notes:</strong> ${submissionData.additionalNotes}</p>` : ''}
          </div>
          ${meetingDateTime && submissionData.meetingLink ? `
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">📅 Your Scheduled Meeting</h3>
            <p><strong>Date & Time:</strong> ${meetingDateTime}</p>
            <p><strong>Platform:</strong> ${submissionData.meetingPlatform || 'Video Call'}</p>
            <p style="margin-top: 15px;">
              <a href="${submissionData.meetingLink}" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Join Meeting
              </a>
            </p>
            <p style="font-size: 14px; color: #555; margin-top: 10px;">
              Meeting Link: <a href="${submissionData.meetingLink}" style="color: #007bff;">${submissionData.meetingLink}</a>
            </p>
          </div>
          ` : ''}
          <h3 style="color: #2c3e50;">What's Next?</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Our team will review your submission and ${meetingDateTime ? 'meet you at the scheduled time to' : 'reach out shortly to'} discuss your space requirements and create a custom design solution for you.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            If you have any immediate questions, feel free to reply to this email.
          </p>
          <p style="margin-top: 30px; color: #888; font-size: 14px;">
            Best regards,<br>
            <strong>The Design & Supply Team</strong>
          </p>
        </div>
      `,
    });

    console.log("Client confirmation email sent:", clientEmailResponse);

    // Send notification email to admin
    const spacesDetails = submissionData.spaces
      .map((space: any, index: number) => `
        <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #007bff;">
          <strong>Space ${index + 1}:</strong> ${space.name}<br>
          <strong>Dimensions:</strong> ${space.width} × ${space.height} (${space.unit})<br>
          ${space.doorWidth ? `<strong>Door:</strong> ${space.doorWidth} (${space.unit})<br>` : ''}
          ${space.hasWindow ? '<strong>Window:</strong> Yes<br>' : ''}
        </div>
      `)
      .join("");

    const adminEmailResponse = await resend.emails.send({
      from: "Design & Supply Admin <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `New Submission: ${submissionData.fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">🎉 New Submission Received</h1>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Contact Information</h2>
            <p><strong>Name:</strong> ${submissionData.fullName}</p>
            <p><strong>Email:</strong> ${submissionData.email}</p>
            ${submissionData.phone ? `<p><strong>Phone:</strong> ${submissionData.phone}</p>` : ''}
            <p><strong>Postal Code:</strong> ${submissionData.postalCode}</p>
          </div>
          
          ${meetingDateTime && submissionData.meetingLink ? `
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin-top: 0;">📅 Scheduled Meeting</h2>
            <p><strong>Date & Time:</strong> ${meetingDateTime}</p>
            <p><strong>Platform:</strong> ${submissionData.meetingPlatform || 'Video Call'}</p>
            <p><strong>Meeting Link:</strong> <a href="${submissionData.meetingLink}" style="color: #007bff;">${submissionData.meetingLink}</a></p>
            <p style="margin-top: 15px;">
              <a href="${submissionData.meetingLink}" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Join Meeting
              </a>
            </p>
          </div>
          ` : ''}

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #856404; margin-top: 0;">Space Details</h2>
            ${spacesDetails}
          </div>

          ${submissionData.storagePriorities.length > 0 ? `
          <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #0c5460; margin-top: 0;">Storage Priorities</h2>
            <ul>
              ${submissionData.storagePriorities.map((priority: string) => `<li>${priority}</li>`).join("")}
            </ul>
          </div>
          ` : ''}

          ${submissionData.additionalNotes ? `
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #721c24; margin-top: 0;">Additional Notes</h2>
            <p>${submissionData.additionalNotes}</p>
          </div>
          ` : ''}

          <p style="margin-top: 30px; font-size: 14px; color: #888;">
            Please review the submission in your admin dashboard and ${meetingDateTime ? 'prepare for the scheduled meeting' : 'reach out to the client promptly'}.
          </p>
        </div>
      `,
    });

    console.log("Admin notification email sent:", adminEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        clientEmailId: clientEmailResponse.data?.id,
        adminEmailId: adminEmailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
