import Mailgen from 'mailgen'
import nodemailer from 'nodemailer'
import type { Attachment as NodemailerAttachment } from 'nodemailer/lib/mailer'

interface Attachment {
  filename: string
  content: Buffer | string | Uint8Array
  contentType?: string
  encoding?: string
}

interface MailOptions {
  email: string
  subject: string
  mailgenContent?: Mailgen.Content
  htmlContent?: string
  attachments?: Attachment[]
}

export const sendEmail = async (options: MailOptions) => {
  let emailTextual: string = ''
  let emailHtml: string = ''

  if (options.mailgenContent) {
    // Use Mailgen for structured content
    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: process.env.PROJECT_TITLE!,
        link: process.env.PROJECT_URI!,
      },
    })

    emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    emailHtml = mailGenerator.generate(options.mailgenContent)
  } else if (options.htmlContent) {
    // Use custom HTML content
    emailHtml = options.htmlContent
    emailTextual = options.htmlContent.replace(/<[^>]*>/g, '') // Strip HTML tags for plain text
  } else {
    throw new Error('Either mailgenContent or htmlContent must be provided')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  } as nodemailer.TransportOptions)

  // Convert attachments to nodemailer format
  const nodemailerAttachments: NodemailerAttachment[] = (
    options.attachments || []
  ).map((att) => ({
    filename: att.filename,
    content:
      att.content instanceof Uint8Array
        ? Buffer.from(att.content)
        : att.content,
    contentType: att.contentType,
    encoding: att.encoding as any,
  }))

  const mail = {
    from: 'mail.freeapi@gmail.com',
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
    attachments: nodemailerAttachments,
  }

  try {
    await transporter.sendMail(mail)
  } catch (error) {
    console.error(
      'Email service failed silently. Make sure you have provided your SMTP credentials in the .env file'
    )
    console.error('Error: ', error)
  }
}

export const emailVerificationContent = (
  name: string,
  verificationUrl: string,
  expiration: number = 15
): Mailgen.Content => {
  return {
    body: {
      name: name,
      intro: `Welcome to ${process.env.PROJECT_TITLE}! Please verify your email address.`,
      action: {
        instructions: 'To verify your email, please click the button below:',
        button: {
          color: '#4d6bfe',
          text: 'Verify Email',
          link: verificationUrl,
        },
      },
      outro: `Do not reply to this email. This link will expire in ${expiration} minutes.`,
    },
  }
}

export const forgotPasswordContent = (
  name: string,
  passwordResetUrl: string
): Mailgen.Content => {
  return {
    body: {
      name: name,
      intro: 'We received a request to reset the password for your account',
      action: {
        instructions: 'To reset your password, click on the following button:',
        button: {
          // color: "#22BC66",
          text: 'Reset password',
          link: passwordResetUrl,
        },
      },
      outro: 'Link is valid up to 15 mins',
    },
  }
}

export const staffAccountCreationContent = (
  name: string,
  loginUrl: string,
  email: string,
  password: string
): Mailgen.Content => {
  return {
    body: {
      name,
      intro: `You've been added to ${process.env.PROJECT_TITLE}. Your login credentials are below.`,
      table: {
        data: [
          { field: 'Email', value: email },
          { field: 'Password', value: password },
        ],
        columns: {
          customWidth: {
            field: '30%',
            value: '70%',
          },
        },
      },
      action: {
        instructions: 'To log in, click this button:',
        button: {
          color: '#4d6bfe',
          text: 'Login to your account',
          link: loginUrl,
        },
      },
      outro: 'Please change your password after logging in.',
    },
  }
}

export const forgottenPasswordResetContent = (
  name: string,
  resetUrl: string,
  expiration: number = 15
): Mailgen.Content => {
  return {
    body: {
      name,
      intro: 'You requested a password reset.',
      action: {
        instructions: 'Click the button below to reset your password:',
        button: {
          color: '#4d6bfe',
          text: 'Reset Password',
          link: resetUrl,
        },
      },
      outro: `This link will expire in ${expiration} minutes.`,
    },
  }
}

export const salesOrderContent = ({
  customerName,
  orderNumber,
  orderDate,
  amount,
  tenantName,
}: {
  customerName: string
  orderNumber: string | number
  orderDate: string
  amount: number | string
  tenantName: string
}) => {
  return `
  <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8f9fb;">
    <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
      
      <!-- Header Bar -->
      <div style="background-color:#2f80ed;color:#ffffff;padding:20px;text-align:center;font-size:20px;font-weight:bold;">
        Sales Order #${orderNumber}
      </div>
      
      <!-- Body Content -->
      <div style="padding:30px;">
        <p>Dear ${customerName},</p>
        <p>
          Thank you for your business. Your sales order pdf is attached with this email.
        </p>

        <!-- Invoice Box -->
        <div style="margin:30px 0;padding:20px;background-color:#fffef5;border:1px solid #f0eacb;border-radius:6px;">

          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-weight:bold;font-size:14px;">SALES ORDER AMOUNT</div>
            <div style="font-size:24px;color:#d32f2f;font-weight:bold;margin-top:8px;">₹${amount}</div>
          </div>

          <table style="width:100%;font-size:14px;">
            <tr>
              <td style="padding:8px 0;"><strong>Sales Order No</strong></td>
              <td style="text-align:right;">${orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;"><strong>Sales Order Date</strong></td>
              <td style="text-align:right;">${orderDate}</td>
            </tr>
          </table>

          
        </div>

        <p>Regards,<br>${tenantName}</p>
      </div>
    </div>
  </body>
  `
}

export const invoiceContent = ({
  customerName,
  invoiceNumber,
  invoiceDate,
  amount,
  dueDate,
  tenantName,
}: {
  customerName: string
  invoiceNumber: string | number
  invoiceDate: string
  amount: number | string
  dueDate?: string
  tenantName: string
}) => {
  return `
  <body
    style="
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f8f9fb;
    "
  >
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff">
      <!-- Header Bar -->
      <div
        style="
          background-color: #3e6be5;
          color: #ffffff;
          padding: 20px;
          text-align: center;
          font-size: 20px;
          font-weight: bold;
        "
      >
        Invoice #${invoiceNumber}
      </div>

      <!-- Body Content -->
      <div style="padding: 30px">
        <p>Dear ${customerName},</p>
        <p>
          Thank you for your business. Your invoice is attached with this email.
          Please make the payment by the due date mentioned below.
        </p>

        <!-- Invoice Box -->
        <div
          style="
            margin: 30px 0;
            padding: 20px;
            background-color: #f5faff;
            border: 1px solid #d7e8fe;
            border-radius: 6px;
          "
        >
          <div style="text-align: center; margin-bottom: 20px">
            <div style="font-weight: bold; font-size: 14px">INVOICE AMOUNT</div>
            <div
              style="
                font-size: 24px;
                color: #3e6be5;
                font-weight: bold;
                margin-top: 8px;
              "
            >
              ₹${amount}
            </div>
          </div>

          <table style="width: 100%; font-size: 14px">
            <tr>
              <td style="padding: 8px 0"><strong>Invoice No</strong></td>
              <td style="text-align: right">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0"><strong>Invoice Date</strong></td>
              <td style="text-align: right">${invoiceDate}</td>
            </tr>
            ${
              dueDate
                ? `
            <tr>
              <td style="padding: 8px 0"><strong>Due Date</strong></td>
              <td style="text-align: right">${dueDate}</td>
            </tr>
            `
                : ''
            }
          </table>

          <div
            style="
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #fed7d7;
              text-align: center;
            "
          >
            <div style="font-size: 12px; color: #666">
              Please ensure payment is made before the due date to avoid any
              late fees.
            </div>
          </div>
        </div>

        <p>
          If you have any questions regarding this invoice, please don't
          hesitate to contact us.
        </p>
        <p>Regards,<br />${tenantName}</p>
      </div>
    </div>
  </body>
  `
}
