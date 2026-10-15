import { cn } from '@/lib/utils';

export function MaskIcon({
    src,
    className,
}: {
    src: string;
    className?: string;
}) {
    const mask = `url(${src})`;

    return (
        <span
            aria-hidden
            className={cn('inline-block size-5 shrink-0 bg-current', className)}
            style={{
                WebkitMaskImage: mask,
                maskImage: mask,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
            }}
        />
    );
}
