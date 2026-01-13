export const applicationConfirmationTemplate = (applicantName, job) => {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#0f172a;">
    <h2 style="color:#065f46;">Application Received</h2>
    <p>Hi ${applicantName},</p>
    <p>Thank you for applying for the position <strong>${job.title}</strong> at <strong>${job.companyName || "the company"}</strong>.</p>
    <p>We've received your application and the employer will review it shortly. We'll notify you if your application status changes.</p>
    <hr />
    <p style="font-size:0.9rem;color:#475569;">Role: ${job.title}<br/>Location: ${job.city || "N/A"}, ${job.country || "N/A"}</p>
    <p style="font-size:0.85rem;color:#64748b;">Best regards,<br/>The Job Portal Team</p>
  </div>
  `;
};

export const statusUpdateTemplate = (applicantName, job, status) => {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#0f172a;">
    <h2 style="color:#065f46;">Application Status Updated</h2>
    <p>Hi ${applicantName},</p>
    <p>Your application for <strong>${job.title}</strong> at <strong>${job.companyName || "the company"}</strong> has been updated to:</p>
    <p style="font-weight:700;color:#0f172a;">${status}</p>
    <p>If you have any questions, please contact the employer via the platform.</p>
    <hr />
    <p style="font-size:0.85rem;color:#64748b;">Best regards,<br/>The Job Portal Team</p>
  </div>
  `;
};

export const interviewNotificationTemplate = (applicantName, job, interviewDate, zoomLink) => {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#0f172a;">
    <h2 style="color:#065f46;">Interview Scheduled! 🗓️</h2>
    <p>Hi ${applicantName},</p>
    <p>Great news! An interview has been scheduled for the position <strong>${job.title}</strong> at <strong>${job.companyName || "the company"}</strong>.</p>
    <div style="background:#f8fafc; padding:20px; border-radius:12px; margin:20px 0; border:1px solid #e2e8f0;">
      <p style="margin:0 0 10px 0;"><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>
      ${zoomLink ? `<p style="margin:0;"><strong>Zoom Link:</strong> <a href="${zoomLink}" style="color:#0f766e; font-weight:bold;">Join Interview</a></p>` : ""}
    </div>
    <p>Please make sure to be on time. Good luck!</p>
    <hr />
    <p style="font-size:0.85rem;color:#64748b;">Best regards,<br/>The Job Portal Team</p>
  </div>
  `;
};

export const newJobNotificationTemplate = (userName, job, jobId) => {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#0f172a;">
    <h2 style="color:#065f46;">New Job Opportunity! 🚀</h2>
    <p>Hi ${userName},</p>
    <p>A new job has been posted that might interest you:</p>
    <p><strong style="font-size:1.1rem;">${job.title}</strong></p>
    <p><strong>Company:</strong> ${job.companyName || "N/A"}<br/>
       <strong>Location:</strong> ${job.city || "N/A"}, ${job.country || "N/A"}<br/>
       <strong>Category:</strong> ${job.category || "N/A"}
    </p>
    <p style="margin:20px 0;">${job.description ? job.description.substring(0, 300) + "..." : "No description available"}</p>
    <p style="margin:20px 0;">
      <a href="${process.env.FRONTEND_URL}/job/${jobId}" style="background:#0f766e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">View Job Details</a>
    </p>
    <hr />
    <p style="font-size:0.85rem;color:#64748b;">Best regards,<br/>The Job Portal Team</p>
  </div>
  `;
};
export const savedJobTemplate = (applicantName, job, jobId) => {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#0f172a;">
    <h2 style="color:#065f46;">Job Saved! 🎯</h2>
    <p>Hi ${applicantName},</p>
    <p>You've saved a job that matches your profile!</p>
    <p><strong style="font-size:1.1rem;">${job.title}</strong></p>
    <p><strong>Company:</strong> ${job.companyName || "N/A"}<br/>
       <strong>Location:</strong> ${job.city || "N/A"}, ${job.country || "N/A"}<br/>
       <strong>Category:</strong> ${job.category || "N/A"}
    </p>
    <p style="margin:20px 0;">${job.description ? job.description.substring(0, 300) + "..." : "No description available"}</p>
    <p style="margin:20px 0;">
      <a href="${process.env.FRONTEND_URL}/job/${jobId}" style="background:#0f766e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">View & Apply Now</a>
    </p>
    <p style="color:#6b7280;font-size:0.9rem;">Don't forget to apply if you're interested! This opportunity might not be available for long.</p>
    <hr />
    <p style="font-size:0.85rem;color:#64748b;">Best regards,<br/>The Job Portal Team</p>
  </div>
  `;
};
