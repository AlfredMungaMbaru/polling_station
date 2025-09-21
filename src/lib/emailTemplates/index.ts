/**
 * HTML Email Templates for Polling Station Notifications
 * 
 * These templates provide structured, responsive email layouts with consistent branding.
 */

import { 
  PollClosingEmailData,
  PollClosedEmailData,
  NewCommentEmailData,
  CommentReplyEmailData,
  WeeklyDigestEmailData
} from '@/types/notifications'

/**
 * Base email template with header, footer, and consistent styling
 */
export const baseEmailTemplate = (content: string, preheader?: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polling Station</title>
  <style>
    /* Reset and base styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
    }
    
    /* Container */
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    
    /* Content */
    .content {
      padding: 32px 24px;
    }
    .content h2 {
      color: #1f2937;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .content p {
      margin-bottom: 16px;
      font-size: 16px;
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 16px;
      margin: 16px 0;
      text-align: center;
    }
    .button:hover {
      background: #2563eb;
    }
    .button-secondary {
      background: #6b7280;
      color: white !important;
    }
    .button-secondary:hover {
      background: #4b5563;
    }
    
    /* Cards and sections */
    .card {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
    }
    .poll-results {
      margin: 20px 0;
    }
    .poll-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .poll-option:last-child {
      border-bottom: none;
    }
    .percentage-bar {
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      margin: 4px 0;
      overflow: hidden;
    }
    .percentage-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 3px;
    }
    
    /* Footer */
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      .email-container { margin: 0; border-radius: 0; }
      .content { padding: 24px 16px; }
      .header { padding: 20px 16px; }
      .footer { padding: 20px 16px; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}
  
  <div class="email-container">
    <div class="header">
      <h1>📊 Polling Station</h1>
      <p>Your Democratic Voice Platform</p>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>Thanks for being part of Polling Station!</p>
      <p>
        <a href="{{base_url}}/preferences">Manage email preferences</a> • 
        <a href="{{base_url}}/unsubscribe?token={{unsubscribe_token}}">Unsubscribe</a>
      </p>
      <p style="margin-top: 12px; font-size: 12px;">
        © 2024 Polling Station. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`

/**
 * Poll closing soon notification template
 */
export const pollClosingTemplate = (data: PollClosingEmailData): string => {
  const content = `
    <h2>⏰ Poll Closing Soon</h2>
    <p>Hi ${data.user_name},</p>
    
    <p>Just a friendly reminder that the poll <strong>"${data.poll_title}"</strong> will be closing in <strong>${data.hours_remaining} hour${data.hours_remaining !== 1 ? 's' : ''}</strong>.</p>
    
    <div class="card">
      <h3 style="margin-bottom: 12px; color: #1f2937;">Poll Status</h3>
      <p style="margin-bottom: 8px;"><strong>Current votes:</strong> ${data.current_vote_count}</p>
      <p style="margin-bottom: 8px;"><strong>Your vote:</strong> ${data.is_user_voted ? '✅ Voted' : '❌ Not voted yet'}</p>
    </div>
    
    ${!data.is_user_voted ? `
      <p style="color: #dc2626; font-weight: 500;">⚠️ You haven't voted yet! Make sure your voice is heard before the poll closes.</p>
      <a href="${data.poll_url}" class="button">Vote Now</a>
    ` : `
      <p style="color: #059669; font-weight: 500;">✅ Thanks for voting! You can still view the poll and see how it's going.</p>
      <a href="${data.poll_url}" class="button">View Poll</a>
    `}
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Poll will close automatically. Results will be available immediately after closing.
    </p>
  `
  
  const preheader = `Poll "${data.poll_title}" closes in ${data.hours_remaining} hours`
  return baseEmailTemplate(content, preheader)
}

/**
 * Poll closed with results notification template
 */
export const pollClosedTemplate = (data: PollClosedEmailData): string => {
  const content = `
    <h2>📊 Poll Results Are In!</h2>
    <p>Hi ${data.user_name},</p>
    
    <p>The poll <strong>"${data.poll_title}"</strong> has closed with <strong>${data.total_votes} total vote${data.total_votes !== 1 ? 's' : ''}</strong>.</p>
    
    <div class="card">
      <h3 style="margin-bottom: 16px; color: #1f2937;">🏆 Winner: ${data.winner}</h3>
      
      <div class="poll-results">
        ${data.results_summary.map(result => `
          <div class="poll-option">
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: ${result.option === data.winner ? '600' : '400'}; color: ${result.option === data.winner ? '#059669' : '#374151'};">
                  ${result.option === data.winner ? '🏆 ' : ''}${result.option}
                </span>
                <span style="font-weight: 500; color: #6b7280;">
                  ${result.votes} vote${result.votes !== 1 ? 's' : ''} (${result.percentage}%)
                </span>
              </div>
              <div class="percentage-bar">
                <div class="percentage-fill" style="width: ${result.percentage}%; background-color: ${result.option === data.winner ? '#059669' : '#3b82f6'};"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    ${data.user_vote ? `
      <p style="color: #059669; font-weight: 500;">
        ✅ Your vote: <strong>${data.user_vote}</strong>
      </p>
    ` : ''}
    
    <a href="${data.poll_url}" class="button">View Full Results</a>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Want to create your own poll? <a href="{{base_url}}/create" style="color: #3b82f6;">Start here</a>
    </p>
  `
  
  const preheader = `"${data.poll_title}" poll results: ${data.winner} wins with ${data.total_votes} total votes`
  return baseEmailTemplate(content, preheader)
}

/**
 * New comment notification template
 */
export const newCommentTemplate = (data: NewCommentEmailData): string => {
  const content = `
    <h2>💬 New Comment</h2>
    <p>Hi ${data.user_name},</p>
    
    <p>There's a new comment on the poll <strong>"${data.poll_title}"</strong>.</p>
    
    <div class="card">
      <h3 style="margin-bottom: 12px; color: #1f2937;">Comment from ${data.commenter_name}</h3>
      <p style="font-style: italic; color: #4b5563; line-height: 1.5;">
        "${data.comment_text}"
      </p>
      <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">
        Posted on ${new Date(data.comment_time).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
    
    <a href="${data.comment_url}" class="button">Read Comment & Reply</a>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Join the discussion and share your thoughts on this poll.
    </p>
  `
  
  const preheader = `${data.commenter_name} commented on "${data.poll_title}"`
  return baseEmailTemplate(content, preheader)
}

/**
 * Comment reply notification template
 */
export const commentReplyTemplate = (data: CommentReplyEmailData): string => {
  const content = `
    <h2>🔔 Someone Replied to Your Comment</h2>
    <p>Hi ${data.user_name},</p>
    
    <p><strong>${data.replier_name}</strong> replied to your comment on the poll <strong>"${data.poll_title}"</strong>.</p>
    
    <div class="card">
      <h3 style="margin-bottom: 12px; color: #1f2937;">Your original comment:</h3>
      <p style="font-style: italic; color: #6b7280; margin-bottom: 16px; padding-left: 12px; border-left: 3px solid #e5e7eb;">
        "${data.original_comment_text}"
      </p>
      
      <h3 style="margin-bottom: 12px; color: #1f2937;">${data.replier_name}'s reply:</h3>
      <p style="font-style: italic; color: #4b5563; line-height: 1.5; padding: 12px; background: #f0f9ff; border-radius: 6px;">
        "${data.reply_text}"
      </p>
      <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">
        Replied on ${new Date(data.reply_time).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
    
    <a href="${data.reply_url}" class="button">View Reply & Respond</a>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Keep the conversation going! Reply back to continue the discussion.
    </p>
  `
  
  const preheader = `${data.replier_name} replied to your comment on "${data.poll_title}"`
  return baseEmailTemplate(content, preheader)
}

/**
 * Weekly digest notification template
 */
export const weeklyDigestTemplate = (data: WeeklyDigestEmailData): string => {
  const content = `
    <h2>📈 Your Weekly Polling Activity</h2>
    <p>Hi ${data.user_name},</p>
    
    <p>Here's your weekly summary for ${new Date(data.week_start).toLocaleDateString()} - ${new Date(data.week_end).toLocaleDateString()}.</p>
    
    <div class="card">
      <h3 style="margin-bottom: 16px; color: #1f2937;">📊 Your Activity</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${data.polls_created}</div>
          <div style="font-size: 14px; color: #6b7280;">Polls Created</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #059669;">${data.polls_voted}</div>
          <div style="font-size: 14px; color: #6b7280;">Polls Voted</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${data.comments_made}</div>
          <div style="font-size: 14px; color: #6b7280;">Comments Made</div>
        </div>
      </div>
    </div>
    
    ${data.featured_polls.length > 0 ? `
      <div class="card">
        <h3 style="margin-bottom: 16px; color: #1f2937;">🌟 Your Featured Polls</h3>
        ${data.featured_polls.map(poll => `
          <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 500; color: #1f2937;">${poll.title}</div>
            <div style="font-size: 14px; color: #6b7280;">${poll.votes} votes</div>
            <a href="${poll.url}" style="font-size: 14px; color: #3b82f6; text-decoration: none;">View Poll →</a>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    ${data.trending_polls.length > 0 ? `
      <div class="card">
        <h3 style="margin-bottom: 16px; color: #1f2937;">🔥 Trending Polls</h3>
        ${data.trending_polls.map(poll => `
          <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 500; color: #1f2937;">${poll.title}</div>
            <div style="font-size: 14px; color: #6b7280;">${poll.votes} votes</div>
            <a href="${poll.url}" style="font-size: 14px; color: #3b82f6; text-decoration: none;">View Poll →</a>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <a href="{{base_url}}/dashboard" class="button">View Your Dashboard</a>
    
    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Ready to create your next poll? <a href="{{base_url}}/create" style="color: #3b82f6;">Get started</a>
    </p>
  `
  
  const preheader = `Your polling activity: ${data.polls_created} created, ${data.polls_voted} voted, ${data.comments_made} comments`
  return baseEmailTemplate(content, preheader)
}

/**
 * Template renderer that processes template variables
 */
export const renderTemplate = (template: string, variables: Record<string, string>): string => {
  let rendered = template
  
  // Replace all {{variable}} placeholders with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, value)
  })
  
  return rendered
}

/**
 * Get template by notification type
 */
export const getEmailTemplate = (
  type: string, 
  data: PollClosingEmailData | PollClosedEmailData | NewCommentEmailData | CommentReplyEmailData | WeeklyDigestEmailData
): string => {
  switch (type) {
    case 'poll_closing_soon':
      return pollClosingTemplate(data as PollClosingEmailData)
    case 'poll_closed':
      return pollClosedTemplate(data as PollClosedEmailData)
    case 'new_comment':
      return newCommentTemplate(data as NewCommentEmailData)
    case 'comment_reply':
      return commentReplyTemplate(data as CommentReplyEmailData)
    case 'weekly_digest':
      return weeklyDigestTemplate(data as WeeklyDigestEmailData)
    default:
      throw new Error(`Unknown email template type: ${type}`)
  }
}