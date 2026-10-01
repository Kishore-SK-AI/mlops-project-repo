import cryptoModule from 'crypto';

export const crypto = {
  md5: (content: string): string => {
    return cryptoModule.createHash('md5').update(content).digest('hex');
  },
  sha256: (content: string): string => {
    return cryptoModule.createHash('sha256').update(content).digest('hex');
  }
};
