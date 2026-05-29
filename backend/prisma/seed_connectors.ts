import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const definitions = [
    {
      id: 'Twilio',
      name: 'Twilio',
      category: 'Communication',
      logo: 'MessageSquare',
      fields: [
        { name: 'accountSid', label: 'Account SID', placeholder: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', isSensitive: false },
        { name: 'authToken', label: 'Auth Token', placeholder: 'Auth Token', isSensitive: true },
        { name: 'phoneNumber', label: 'Phone Number', placeholder: '+1234567890', isSensitive: false },
        { name: 'twimlAppSid', label: 'TwiML App SID', placeholder: 'APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', isSensitive: false }
      ],
      instructions: [
        "Go to [Twilio Console](https://www.twilio.com/console) and log in or sign up.",
        "On the dashboard, find the Account Info section.",
        "Copy the Account SID and Auth Token.",
        "To get a phone number, navigate to Phone Numbers > Manage > Active Numbers."
      ]
    },
    {
      id: 'Meta',
      name: 'Meta (WhatsApp)',
      category: 'Communication',
      logo: 'Globe',
      fields: [
        { name: 'whatsappToken', label: 'WhatsApp Access Token', placeholder: 'EAAG...', isSensitive: true },
        { name: 'phoneNumberId', label: 'Phone Number ID', placeholder: '102...', isSensitive: false },
        { name: 'wabaId', label: 'WhatsApp Business Account ID', placeholder: '203...', isSensitive: false }
      ],
      instructions: [
        "Visit [Meta for Developers](https://developers.facebook.com/) and log in.",
        "Click on My Apps and create a new app.",
        "In the app dashboard, find and add the WhatsApp product.",
        "Go to WhatsApp > Getting Started on the left sidebar.",
        "Here you will find your Phone Number ID and WhatsApp Business Account ID."
      ]
    },
    {
      id: 'SMTP',
      name: 'SMTP Email',
      category: 'Communication',
      logo: 'Mail',
      fields: [
        { name: 'host', label: 'SMTP Host', placeholder: 'smtp.example.com', isSensitive: false },
        { name: 'port', label: 'SMTP Port', placeholder: '587', isSensitive: false },
        { name: 'user', label: 'Username', placeholder: 'user@example.com', isSensitive: false },
        { name: 'pass', label: 'Password', placeholder: 'Password', isSensitive: true },
        { name: 'from', label: 'From Email', placeholder: 'noreply@example.com', isSensitive: false },
        { name: 'secure', label: 'Use Secure Connection (SSL/TLS)', placeholder: '', isSensitive: false }
      ],
      instructions: [
        "For Gmail: Enable 2-Step Verification, generate an App Password, and use it as the password.",
        "For Outlook: Ensure SMTP AUTH is enabled.",
        "Set Host, Port (usually 587), and From Email."
      ]
    },
    {
      id: 'Razorpay',
      name: 'Razorpay',
      category: 'Payment',
      logo: 'CreditCard',
      fields: [
        { name: 'keyId', label: 'Key ID', placeholder: 'rzp_live_...', isSensitive: false },
        { name: 'keySecret', label: 'Key Secret', placeholder: 'Key Secret', isSensitive: true }
      ],
      instructions: [
        "Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).",
        "Go to Settings > API Keys.",
        "Click Generate Live Key.",
        "Copy the Key ID and Key Secret."
      ]
    },
    {
      id: 'MSG91',
      name: 'MSG91',
      category: 'Communication',
      logo: 'MessageSquare',
      fields: [
        { name: 'authKey', label: 'Auth Key', placeholder: 'Auth Key', isSensitive: true },
        { name: 'senderId', label: 'Sender ID', placeholder: 'ABCDEF', isSensitive: false }
      ],
      instructions: [
        "Log in to [MSG91](https://msg91.com/).",
        "Find your Auth Key in the dashboard.",
        "Create a Sender ID to send SMS."
      ]
    },
    {
      id: 'MetaLeads',
      name: 'Meta (Leads)',
      category: 'Lead Source',
      logo: 'Globe',
      fields: [
        { name: 'verifyToken', label: 'Verify Token', placeholder: 'Verify Token', isSensitive: false },
        { name: 'accessToken', label: 'Access Token', placeholder: 'Access Token', isSensitive: true },
        { name: 'pageId', label: 'Page ID', placeholder: 'Page ID', isSensitive: false },
        { name: 'appSecret', label: 'App Secret', placeholder: 'App Secret', isSensitive: true }
      ],
      instructions: [
        "Set up a webhook in Meta App dashboard.",
        "Provide a Verify Token to verify the webhook.",
        "Provide a Page Access Token and Page ID."
      ]
    },
    {
      id: 'GoogleAds',
      name: 'Google Ads',
      category: 'Lead Source',
      logo: 'Globe',
      fields: [
        { name: 'webhookKey', label: 'Webhook Key', placeholder: 'Webhook Key', isSensitive: false }
      ],
      instructions: [
        "Set up a lead form extension in Google Ads.",
        "Add a webhook URL pointing to your system.",
        "Provide a Webhook Key to authenticate requests."
      ]
    }
  ];

  for (const def of definitions) {
    await (prisma as any).connectorDefinition.upsert({
      where: { id: def.id },
      update: {
        name: def.name,
        category: def.category,
        logo: def.logo,
        fields: def.fields,
        instructions: def.instructions
      },
      create: {
        id: def.id,
        name: def.name,
        category: def.category,
        logo: def.logo,
        fields: def.fields,
        instructions: def.instructions
      }
    });
  }

  console.log('Seed data for connectors inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
