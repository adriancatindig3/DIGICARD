// emailJS.jsx
import emailjs from '@emailjs/browser';

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export const sendEmails = async (formData) => {
  const {
    visitorEmail,
    visitorName,
    visitorCompany,
    visitorPhone,
    visitorMessage,
    ownerEmail,
    ownerName,
  } = formData;

  try {
    // ============================================
    // EMAIL 1: Send to OWNER (template_lmq4po7)
    // ============================================
    const ownerParams = {
      to_email: ownerEmail,  // 👈 ADD THIS - sends to the owner!
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_company: visitorCompany || 'Not provided',
      visitor_phone: visitorPhone || 'Not provided',
      visitor_message: visitorMessage,
    };

    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID_OWNER,
      ownerParams
    );
    console.log('✅ Owner notification sent to:', ownerEmail);

    // ============================================
    // EMAIL 2: Send to VISITOR (template_nelbnmm)
    // ============================================
    const visitorParams = {
      name: visitorName,
      profile_name: ownerName,
      email: visitorEmail,
      company: visitorCompany || 'Not provided',
      phone: visitorPhone || 'Not provided',
      visitor_message: visitorMessage,
    };

    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID_VISITOR,
      visitorParams
    );
    console.log('✅ Visitor confirmation sent to:', visitorEmail);

    return { success: true };

  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.text || error.message || 'Failed to send email' 
    };
  }
};