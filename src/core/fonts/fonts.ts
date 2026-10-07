import { Archivo, Pixelify_Sans } from 'next/font/google';

export const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixelify',
});

export const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
});
