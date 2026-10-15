import { MaskIcon } from '@/components/common/mask-icon';

const SOCIALS = [
    { src: '/icons/facebook.svg', label: 'Facebook' },
    { src: '/icons/whatsapp.svg', label: 'WhatsApp' },
    { src: '/icons/instagram.svg', label: 'Instagram' },
];

export function SiteFooter() {
    return (
        <footer className="mt-16 bg-card text-muted-foreground">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6 text-sm">
                <p>
                    © Copyright <strong className="text-foreground/80">VL Tech</strong>
                </p>
                <ul className="flex items-center gap-3">
                    {SOCIALS.map((social) => (
                        <li key={social.label} title={social.label}>
                            <MaskIcon src={social.src} className="size-6" />
                            <span className="sr-only">{social.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </footer>
    );
}
