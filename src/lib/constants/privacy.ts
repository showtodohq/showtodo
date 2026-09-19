/**
 * Single source of truth for the ShowTodo Privacy Policy (/privacy).
 * Formatted for international standards (GDPR, CCPA, COPPA) with
 * high signal-to-noise ratio and plain-English executive summaries.
 */

export interface PrivacySection {
	id: string;
	title: string;
	plainTakeaway: string;
	content: string[];
	listItems?: string[];
	callout?: {
		type: 'note' | 'tip' | 'important';
		text: string;
	};
}

export interface PrivacyPolicyData {
	meta: {
		title: string;
		description: string;
		effectiveDate: string;
		lastUpdated: string;
		version: string;
		contactEmail: string;
	};
	quickHighlights: {
		title: string;
		description: string;
		icon: string;
	}[];
	sections: PrivacySection[];
}

export const PRIVACY_POLICY: PrivacyPolicyData = {
	meta: {
		title: 'Privacy Policy · ShowTodo',
		description:
			'Official Privacy Policy for ShowTodo. Learn how we protect your personal data, handle public task records, and uphold strict data ownership standards.',
		effectiveDate: 'September 1, 2026',
		lastUpdated: 'September 19, 2026',
		version: '1.0.0',
		contactEmail: 'privacy@showtodo.io'
	},
	quickHighlights: [
		{
			title: 'We Never Sell Your Data',
			description:
				'We do not sell, rent, or trade your personal data to advertisers, data brokers, or third parties under any circumstances.',
			icon: 'lucide:shield-check'
		},
		{
			title: 'Public by Design, Protected by Default',
			description:
				'Task titles you publish to the feed are intentionally public for accountability. Your account credentials and private notes remain strictly protected.',
			icon: 'lucide:globe'
		},
		{
			title: 'Full Ownership & Right to Erasure',
			description:
				'You retain 100% ownership of your data. You can edit, export, or permanently delete your tasks and identity at any time.',
			icon: 'lucide:trash-2'
		}
	],
	sections: [
		{
			id: 'introduction',
			title: '1. Introduction & Our Core Philosophy',
			plainTakeaway:
				'ShowTodo is built around transparency and public accountability, but safeguarding your personal account data and privacy choices is fundamental to everything we do.',
			content: [
				'Welcome to ShowTodo ("we", "us", or "our"). ShowTodo is a public-first task and accountability network designed for creators, learners, and builders to share their progress openly.',
				'By design, ShowTodo makes task items visible across the open web to help you overcome procrastination through social commitment. However, your trust is paramount. This Privacy Policy details our transparent approach to data collection, usage, processing, and the extensive legal rights you hold under international data protection laws, including the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).'
			]
		},
		{
			id: 'information-we-collect',
			title: '2. Information We Collect',
			plainTakeaway:
				'We collect only what is strictly necessary to provide the service: your email identity, the tasks you choose to post, and minimal technical telemetry.',
			content: [
				'We collect information in three transparent ways: information you provide directly, public activity you generate, and minimal automated telemetry required for platform reliability.'
			],
			listItems: [
				'Account Credentials: Your email address, chosen nickname, and avatar preference (or algorithmically generated avatar).',
				'Task & Content Data: The titles of todos you post, planned start and due dates, completion statuses, category tags, and optional notes.',
				'Interaction Data: Emoji reactions you send or receive to encourage fellow builders.',
				'Technical & Device Telemetry: IP addresses (anonymized for security logs), browser user-agent, operating system, and timestamp logs used strictly for DDoS mitigation, rate limiting, and spam defense.',
				'Cookies & Local Storage: Minimal functional browser storage (localStorage) utilized to preserve your theme preference (dark/light mode) and active session tokens.'
			],
			callout: {
				type: 'note',
				text: 'Private Notes Option: While todo titles are always visible on the public feed, you may set the optional "Note" field to private, keeping sensitive details visible only to you.'
			}
		},
		{
			id: 'how-we-use-information',
			title: '3. How We Use Your Information',
			plainTakeaway:
				'Your information is used solely to operate the platform, generate your streak heatmap, prevent abuse, and keep your tasks synced.',
			content: [
				'We process your data strictly under valid lawful bases, including contract performance, legitimate interests in maintaining platform integrity, and your explicit consent.'
			],
			listItems: [
				'Delivering the core ShowTodo service: Displaying your public feed, generating profile pages, and maintaining your activity streaks.',
				'Generating aggregated, non-personally identifiable community statistics (such as global task completion rates on the /stats dashboard).',
				'Detecting and preventing automated bot spam, abuse, scraping, and unauthorized system penetration.',
				'Communicating critical account security updates, system changes, or responses to customer support requests.'
			]
		},
		{
			id: 'data-sharing',
			title: '4. Data Sharing & Third-Party Processors',
			plainTakeaway:
				'We never sell your data. We only share necessary technical information with audited infrastructure providers who adhere to strict data protection standards.',
			content: [
				'ShowTodo does NOT sell, rent, monetize, or disclose your personal identifiable information to marketing brokers, behavioral ad networks, or data aggregators.',
				'We partner exclusively with trusted, SOC2/ISO-certified cloud infrastructure providers who act strictly as Data Processors bound by legal Data Processing Agreements (DPAs):'
			],
			listItems: [
				'Database & Cloud Hosting: Neon (Serverless Postgres) and modern serverless edge hosting providers running encrypted databases.',
				'Avatar Services: DiceBear open avatar API (only your non-reversible nickname seed is passed; no email or personal identifiers are ever transmitted).',
				'Legal Compliance: We may disclose data only if required by a valid court order, subpoena, or binding legal process by law enforcement.'
			]
		},
		{
			id: 'user-rights',
			title: '5. Your Rights & Data Ownership (GDPR & CCPA)',
			plainTakeaway:
				'You retain complete ownership of everything you post. You have the full right to access, edit, download, or permanently wipe your data.',
			content: [
				'Regardless of where you reside globally, ShowTodo extends comprehensive data ownership rights to all users, fully reflecting GDPR, CCPA, and global privacy frameworks:'
			],
			listItems: [
				'Right to Access & Portability: You may request a complete machine-readable copy (JSON) of all tasks, activities, and reactions associated with your account.',
				'Right to Rectification: You can update your nickname, avatar, or edit existing task details at any time.',
				'Right to Erasure (The Right to be Forgotten): You can request permanent deletion of your account and all associated todos from our active databases.',
				'Right to Object or Restrict Processing: You have the right to withdraw consent for non-essential processing at any time.'
			],
			callout: {
				type: 'important',
				text: 'To exercise any of your data rights, simply email privacy@showtodo.io. We process verification and complete erasure requests within 14 business days.'
			}
		},
		{
			id: 'security-and-retention',
			title: '6. Security Standards & Retention',
			plainTakeaway:
				'All data is encrypted in transit and at rest. We retain your public history until you delete it or request account removal.',
			content: [
				'We implement industry-standard administrative, physical, and technical security safeguards to prevent unauthorized access, disclosure, or loss:',
				'Encryption: All web traffic is strictly served over HTTPS/TLS 1.3 with HSTS. Data stored in our databases is encrypted at rest using AES-256.',
				'Retention Schedule: We retain your public todos and profile as long as your account remains active, ensuring your historical heatmap and streaks remain accurate. If you delete a todo, it is removed immediately from public indexes and purged from database backups in accordance with standard backup rotation cycles.'
			]
		},
		{
			id: 'children-privacy',
			title: "7. Children's Privacy (COPPA & GDPR-K)",
			plainTakeaway:
				'ShowTodo is designed for individuals aged 13 and older (or 16 in the European Economic Area). We do not knowingly collect data from children.',
			content: [
				'ShowTodo does not knowingly collect or solicit personal information from anyone under the age of 13 (or under 16 for residents within the EEA). If we learn that we have collected personal data from a child below these age thresholds without verified parental consent, we will promptly delete that information from our systems.'
			]
		},
		{
			id: 'updates-and-contact',
			title: '8. Policy Updates & Contact Channels',
			plainTakeaway:
				'We will notify users of any material changes to this policy. Questions or concerns can be sent directly to our privacy desk.',
			content: [
				'We may update this Privacy Policy periodically to reflect technological enhancements, regulatory developments, or product improvements. When changes are made, the "Last Updated" date at the top of this document will be revised.',
				'If you have questions, inquiries, or feedback concerning this Privacy Policy, please contact our Data Protection desk:'
			],
			listItems: [
				'Email: privacy@showtodo.io',
				'Subject Line: [Privacy Inquiry] - ShowTodo Legal Desk',
				'Response Commitment: We respond to all formal inquiries within 48 business hours.'
			]
		}
	]
};
