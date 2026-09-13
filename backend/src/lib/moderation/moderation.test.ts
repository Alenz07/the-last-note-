import { describe, expect, it } from 'vitest';
import { moderate, normalizeForMatch } from './index';

describe('moderate', () => {
  it('accepts ordinary confessions, including profanity and Hinglish', () => {
    expect(moderate('I fucked up the one thing that actually mattered to me this year, and I have not told a single person about it, not even the ones who would forgive me.').ok).toBe(true);
    expect(moderate('Main roz subah office ke liye nikalta hoon, laptop bag ke saath, par teen mahine se koi job nahi hai, aur ghar par abhi tak kisi ko bataya nahi hai.').ok).toBe(true);
    expect(moderate('यह बात मैंने आज तक किसी को नहीं बताई, न घर पर, न दोस्तों को, और अब लगता है कि जितना समय बीतता जा रहा है, उतना ही कहना मुश्किल होता जा रहा है।').ok).toBe(true);
  });

  it('rejects empty, too short and over-long', () => {
    const sentence = 'I kept the receipt from the day we met and I read it when the house is quiet. ';
    const atMax = sentence.repeat(14).slice(0, 1000);

    expect(moderate('   ')).toMatchObject({ ok: false, reason: 'empty' });
    // a throwaway one-liner no longer buys someone's ₹5
    expect(moderate('lol same')).toMatchObject({ ok: false, reason: 'too_short' });
    expect(moderate(sentence.slice(0, 119))).toMatchObject({ ok: false, reason: 'too_short' });

    // exactly on the floor and exactly on the ceiling both pass
    expect(moderate(sentence.repeat(2).slice(0, 120)).ok).toBe(true);
    expect(moderate(atMax).ok).toBe(true);
    expect(moderate(atMax + 'x')).toMatchObject({ ok: false, reason: 'too_long' });
  });

  it('blocks phone numbers even with separators', () => {
    expect(moderate('call me 98765 43210')).toMatchObject({ ok: false, reason: 'phone' });
    expect(moderate('+91-98765-43210 anytime')).toMatchObject({ ok: false, reason: 'phone' });
    expect(moderate('my number is 9876543210')).toMatchObject({ ok: false, reason: 'phone' });
    expect(moderate('I was 25 in 2019 and completely broke, counting coins for the bus fare home, and somehow that whole year still feels lighter to me than this one does.').ok).toBe(true);
  });

  it('blocks urls, emails, handles and upi ids', () => {
    expect(moderate('see kadi.in/c/confess')).toMatchObject({ ok: false, reason: 'url' });
    expect(moderate('https://example.com')).toMatchObject({ ok: false, reason: 'url' });
    expect(moderate('mail me at x@y.com')).toMatchObject({ ok: false, reason: 'contact' });
    expect(moderate('pay me rahul123@ybl')).toMatchObject({ ok: false, reason: 'contact' });
    expect(moderate('insta: rahul_123')).toMatchObject({ ok: false, reason: 'contact' });
    expect(moderate('ig rahul_123')).toMatchObject({ ok: false, reason: 'contact' });
    expect(moderate('find me @rahul_123')).toMatchObject({ ok: false, reason: 'contact' });
    // words that merely start with a platform keyword are fine
    expect(moderate('Meera sat down across from me without saying anything at all, and the chai was still warm enough to hold, so we stayed like that for a long while.').ok).toBe(true);
    expect(moderate('I want to wait a little longer before deciding anything. Ignore me if this sounds dramatic, but the tiger in that old story was big for a good reason.').ok).toBe(true);
  });

  it('blocks slurs with leetspeak and stretched letters', () => {
    expect(moderate('tu ch00tiya hai')).toMatchObject({ ok: false, reason: 'profanity' });
    expect(moderate('bhenchoddd')).toMatchObject({ ok: false, reason: 'profanity' });
    expect(moderate('kill yourself already')).toMatchObject({ ok: false, reason: 'profanity' });
  });

  it('flags obvious filler', () => {
    expect(moderate('lol lol lol lol lol lol lol')).toMatchObject({ ok: false, reason: 'repeat' });
    expect(moderate('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toMatchObject({ ok: false, reason: 'repeat' });
  });

  it('normalises', () => {
    expect(normalizeForMatch('Ch00Tiyaaa!!')).toBe('chootiya');
    expect(normalizeForMatch('B.h.e.n.c.h.o.d')).toBe('b h e n c h o d');
  });
});
