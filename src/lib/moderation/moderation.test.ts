import { describe, expect, it } from 'vitest';
import { moderate, normalizeForMatch } from './index';

describe('moderate', () => {
  it('accepts ordinary confessions, including profanity and Hinglish', () => {
    expect(moderate('I fucked up the one thing that mattered and told no one.').ok).toBe(true);
    expect(moderate('Main roz office ke liye nikalta hoon, par 3 mahine se job nahi hai.').ok).toBe(true);
    expect(moderate('मैंने कभी किसी को नहीं बताया।').ok).toBe(true);
  });

  it('rejects empty and over-long', () => {
    expect(moderate('   ')).toMatchObject({ ok: false, reason: 'empty' });
    const sentence = 'I kept the receipt from the day we met and I read it when the house is quiet. ';
    const exactly280 = sentence.repeat(4).slice(0, 280);
    expect(moderate(exactly280 + 'x')).toMatchObject({ ok: false, reason: 'too_long' });
    expect(moderate(exactly280).ok).toBe(true);
  });

  it('blocks phone numbers even with separators', () => {
    expect(moderate('call me 98765 43210')).toMatchObject({ ok: false, reason: 'phone' });
    expect(moderate('+91-98765-43210 anytime')).toMatchObject({ ok: false, reason: 'phone' });
    expect(moderate('my number is 9876543210')).toMatchObject({ ok: false, reason: 'phone' });
    expect(moderate('I was 25 in 2019 and broke').ok).toBe(true);
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
    expect(moderate('Meera sat. The chai was still warm.').ok).toBe(true);
    expect(moderate('I want to wait. Ignore me. The tiger was big.').ok).toBe(true);
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
