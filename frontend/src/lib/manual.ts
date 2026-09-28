import { SITE } from './site';

/**
 * Everything the downloadable manual says, as data. The PDF component does
 * layout only, so the words can be edited here without touching design.
 *
 * Keep it true to the implementation: the window is per-chain (10 min default),
 * text unseals after `unsealAfter` more notes (50 default), media never does.
 */

export const manual = {
  title: 'User manual',
  subtitle: SITE.tagline,
  intro:
    'A chain of notes left by strangers. You pay Rs 5 to read what the last person left, then you leave yours for the next one. No accounts, no names, no way back.',
  version: 'Version 1 · September 2026',

  /* ---------------------------------------------------------------- basics */
  howItWorks: {
    heading: 'How it works',
    lede: 'Six steps, start to finish. The whole thing takes about two minutes.',
    steps: [
      {
        n: '1',
        title: 'Choose a chain',
        body: 'Each chain is a different kind of note — a confession, advice to a stranger, one line of a shared story. Every chain runs separately and has its own numbering.',
      },
      {
        n: '2',
        title: 'Look at what is sealed',
        body: 'Before you pay you can see everything about the note except the note: its number, the city it came from, how long ago it was left, how many characters it is, whether it has a voice note or a photo, and how many people have read it. You see the shape, never the content.',
      },
      {
        n: '3',
        title: 'Pay Rs 5',
        body: 'One payment buys two things: one reveal, and one numbered slot of your own. Pay by UPI, card, netbanking or wallet. Nothing is stored about you beyond the payment reference.',
      },
      {
        n: '4',
        title: 'Read it',
        body: 'The note opens in full — the words, the voice note, the photo, and a way to reach the writer if they chose to leave one. Some chains, like story chains, show you the last three notes instead of one so the thread makes sense.',
      },
      {
        n: '5',
        title: 'Leave yours',
        body: 'You now have twenty minutes to write your own note. Between 120 and 1,000 characters, plus an optional voice note of up to 30 seconds and one optional photo. Nobody reads it until the next stranger pays. Underneath the note there is a separate contact box, also optional — that is the one place a phone number, Instagram or email is allowed, and only the single person who pays to read your note ever sees it.',
      },
      {
        n: '6',
        title: 'Get your number and share it',
        body: 'You become a numbered link in the chain — "you are note #4,372". Share that number with anyone; whoever opens your link pays Rs 5 to read what you wrote, and you are told the moment it happens.',
      },
    ],
  },

  whatYouGet: {
    heading: 'What Rs 5 buys',
    lede: 'Exactly two things, delivered the moment the payment clears.',
    gets: [
      'One reveal — the complete note left before yours: the text, the voice note, the photo, and the writer’s contact if they shared one.',
      'One slot — a permanent numbered position in the chain that only you can write into.',
    ],
    notGets: [
      'It does not buy the whole chain. One payment, one note.',
      'It does not buy the right to read your note again later for free — but your own note stays on your link page forever.',
      'No money is ever paid out to users. Rs 5 is a platform fee, not a deposit, prize or investment.',
    ],
  },

  /* ------------------------------------------------------------ edge cases */
  edgeCases: {
    heading: 'What happens if…',
    lede: 'The situations people actually run into, and exactly what the system does in each one.',
    groups: [
      {
        group: 'About paying',
        items: [
          {
            q: 'I paid but never wrote my note.',
            a: 'Your slot passes unwritten once the twenty minutes are up. The number stays yours forever and still appears in the chain, marked as passed. The chain’s numbering never breaks and nobody behind you is held up — the next reader simply gets the last note that was actually written. The Rs 5 is not refunded, because the reveal was already delivered: you read someone’s note.',
          },
          {
            q: 'I paid and closed the page before reading anything.',
            a: 'Nothing is lost. The payment is confirmed by the gateway directly to our server, independently of your browser, so your slot is created whether or not the tab survived. Reopen the site and go to "Your links" on the same device, or use "Lost a link?" and paste your payment ID. Your reveal is waiting.',
          },
          {
            q: 'Money left my account but I got nothing at all.',
            a: 'Every few minutes the system re-checks any payment that never completed and finishes the job automatically. Almost all of these resolve on their own within minutes. If 24 hours pass and "Lost a link?" still cannot find your slot from the payment ID, that is a failed delivery and we refund the full amount — write to the grievance contact with the payment ID.',
          },
          {
            q: 'My payment failed.',
            a: 'Nothing is charged. If your bank shows a deduction on a failed payment it is reversed automatically, usually within a few days, without anyone doing anything. Just try again.',
          },
          {
            q: 'I was charged twice for one slot.',
            a: 'We refund the duplicate. Write to the grievance contact with both payment IDs.',
          },
        ],
      },
      {
        group: 'Letting someone reach you',
        items: [
          {
            q: 'Can the person who reads my note reach me?',
            a: 'Yes, if you choose to let them. There are two boxes and they have opposite rules: contact details are never allowed inside the note itself, and always allowed in the separate contact box underneath it. That box is optional, up to 80 characters — a WhatsApp number, an Instagram handle, an email. Only the one stranger who pays to read your note ever sees it. It is never published and never unsealed. Plenty of people use it: someone writes back to say the advice helped, or to ask how the story ended.',
          },
          {
            q: 'What if I leave the contact box empty?',
            a: 'Nothing changes for your reader — they still read your note and still continue the chain. You simply stay unreachable, and nobody learns who you are. It is entirely your choice, and both choices are normal.',
          },
          {
            q: 'Why was my number blocked inside the note?',
            a: 'Because the note itself can become public later. Once the chain moves fifty notes past yours, your text appears on the chain’s public page for anyone to read — so a number written into the text would end up in front of everyone, permanently. That is why numbers, links, emails, UPI IDs and handles are blocked in the text, and why the contact box exists instead. The box stays private to your one reader, whatever happens to the text.',
          },
        ],
      },
      {
        group: 'About your note',
        items: [
          {
            q: 'Nobody has read my note yet.',
            a: 'It stays sealed. The next person who pays in that chain will read it. Your link page shows "unread" until then, and you can turn on a notification so you know the moment it is opened.',
          },
          {
            q: 'Someone reports my note.',
            a: 'One report changes nothing. Once a note collects three reports it is hidden automatically and a human reviews it within 72 hours. If it did not break the content policy it comes straight back. If it did, it is removed — the number stays in the chain marked as removed, so the numbering never lies about what happened.',
          },
          {
            q: 'I want to delete or edit what I wrote.',
            a: 'You cannot undo a sealed note yourself — it may already have been read and paid for. If there is a real problem (you revealed something about another person, or you shared a contact by mistake), write to the grievance contact with your note number and we will remove it.',
          },
          {
            q: 'When does my note become public?',
            a: 'Only the text, and only after the chain has moved a set number of notes past yours — fifty by default, and the exact number is shown on every chain page. At that point the text appears on the chain’s public page for anyone to read. Your voice note and your photo are never unsealed, never published, and never shown to anyone but the single person who paid to read them.',
          },
        ],
      },
      {
        group: 'About getting back in',
        items: [
          {
            q: 'I cleared my cookies, or I am on a different phone.',
            a: '"Your links" works off an anonymous cookie that lasts a year, so clearing it or switching devices empties that list. Nothing is lost, though: each note has its own secret link page. Save or bookmark that link when you get it. If you did not, use "Lost a link?" and paste the payment ID from your bank or UPI app.',
          },
          {
            q: 'Can I log in instead?',
            a: 'There is no login and there never will be. No email, no password, no profile. Your payment receipt is effectively your account, which is why the payment ID is the way back in.',
          },
        ],
      },
      {
        group: 'About the chain itself',
        items: [
          {
            q: 'I am the first person in a chain.',
            a: 'There is nothing to read yet, and you are told so before you pay. You still pay Rs 5, because it buys your slot — you write the opening line that the next stranger will pay to read.',
          },
          {
            q: 'Someone shared their note link with me.',
            a: 'You will read that specific note rather than whichever one happens to be latest. If that note has since been hidden or removed, or it turns out to be your own, you get the most recent note instead so your Rs 5 always buys a real reveal.',
          },
          {
            q: 'The person before me left nothing.',
            a: 'You never see an empty note. The reveal always skips slots that passed unwritten and gives you the most recent note that was actually written, however far back that is.',
          },
          {
            q: 'Two of us paid at exactly the same moment.',
            a: 'You get different numbers. Positions are handed out one at a time and can never be duplicated or skipped, no matter how many people pay at once.',
          },
        ],
      },
    ],
  },

  /* -------------------------------------------------------------- the rules */
  rules: {
    heading: 'What you may write',
    lede: 'A short list, firmly enforced. Write to a stranger the way you would want a stranger to write to you.',
    limits: [
      'Text: between 120 and 1,000 characters — roughly 20 to 170 words.',
      'Voice note: optional, up to 30 seconds.',
      'Photo: optional, one per note.',
      'Contact: optional, up to 80 characters — the one place contact details are allowed. Seen only by the person who pays to read your note; never published.',
      'Time to write: twenty minutes from the moment you pay.',
    ],
    banned: [
      'Contact or payment details inside the text — numbers, links, emails, UPI IDs, handles. Use the contact field instead.',
      'Slurs, harassment, threats or hate, in any language.',
      'Sexual content involving minors. Reported to the authorities.',
      'Claims or secrets about named or identifiable people. Write about your own life.',
      'Spam, ads, recruiting or schemes.',
      'Anything illegal under Indian law, including content listed in Rule 3(1)(b) of the IT Rules, 2021.',
    ],
    enforcement:
      'Automatic filters run before a note is sealed. Any reader can report a note. Three reports hide it automatically, and it is reviewed within 72 hours. Removed content is kept for up to 180 days to answer lawful requests, then deleted. We ban both the device and the payment identity behind repeat breaches.',
  },

  /* ----------------------------------------------------------------- legal */
  legal: {
    heading: 'Terms and policies',
    lede: 'The short version. The full text lives on the site and always overrides this summary.',
    sections: [
      {
        title: 'What you are buying',
        body: 'Rs 5 is a platform fee for one reveal and one slot. That is the entire service. No money is ever paid out to users, and nothing here is a prize, reward, deposit or investment. This is not a prize chit or money circulation scheme under the Prize Chits and Money Circulation Schemes (Banning) Act, 1978.',
      },
      {
        title: 'Who can use it',
        body: 'You must be 18 or older.',
      },
      {
        title: 'What you write',
        body: 'Everything on the site is written by users, not by us. You keep ownership of your words and give us permission to store them, show them to the reader the chain gives them to, and — for text only — publish them on the chain’s public page once the chain has moved past the stated number of notes. Voice notes and photos are never published.',
      },
      {
        title: 'Refunds',
        body: 'No refunds, with two exceptions: you paid and no reveal was ever delivered, or you were charged twice for one slot. Not liking the note you read, or missing your twenty-minute window, is not a refund — the reveal was delivered either way. Qualifying refunds go back to the same account within 5–7 working days.',
      },
      {
        title: 'Privacy',
        body: 'We hold as little as possible: an anonymous device cookie, an approximate city from your IP for display, payment references from the gateway, what you chose to write, and a notification subscription if you asked for one. We never see your card or UPI credentials. We do not sell data and there are no ads.',
      },
      {
        title: 'Our limits',
        body: 'The site is provided as is. We do not read what strangers write before you do. Our liability to you is limited to the fee you paid for the affected reveal.',
      },
      {
        title: 'Complaints',
        body: 'Content complaints are acknowledged within 24 hours and acted on within 72 hours, in line with the IT Rules, 2021. Write to the grievance contact listed on the site with your note number or payment ID.',
      },
    ],
    pages: ['Terms of use', 'Privacy policy', 'Refund policy', 'Content policy', 'Grievance contact'],
    closing: 'Nothing in this manual is written by us except the instructions. Every note in the chain belongs to a stranger.',
  },
} as const;
