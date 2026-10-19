import Image from 'next/image';
import Link from 'next/link';

export function PromoBanner({
    value,
    label,
    image,
    href,
}: {
    value: string;
    label: string;
    image: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-around gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#3dd400] to-[#1f6a05] p-6 md:bg-none md:bg-card outline-none transition-shadow hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
            <p className="leading-none">
                <span className="text-sm">até</span>{' '}
                <span className="text-5xl font-extrabold italic text-white md:text-6xl md:text-primary">
                    {value}
                </span>
                <br />
                <span className="text-5xl font-extrabold italic text-white md:text-6xl md:text-primary">
                    OFF
                </span>{' '}
                <span className="text-sm italic">em</span>
                <br />
                <span className="text-xl italic md:text-2xl">{label}</span>
            </p>
            <Image
                src={image}
                alt=""
                width={400}
                height={400}
                className="h-32 w-auto object-contain md:h-52"
            />
        </Link>
    );
}
