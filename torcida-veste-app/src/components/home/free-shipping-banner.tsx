import Image from 'next/image';

export function FreeShippingBanner() {
    return (
        <section
            aria-label="Entrega grátis"
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1b5108] to-[#11280a] px-6 py-8 md:px-16"
        >
            <Image
                src="/brand/brazil-map.png"
                alt=""
                width={201}
                height={180}
                className="pointer-events-none absolute left-[10%] top-1/2 hidden h-56 w-auto -translate-y-1/2 opacity-40 md:block"
            />
            <div className="relative flex items-center justify-center gap-6 md:gap-16">
                <div className="text-center">
                    <p className="text-3xl font-extrabold leading-tight md:text-4xl">
                        Entrega
                        <br />
                        <span className="text-4xl md:text-5xl">Grátis</span>
                    </p>
                    <p className="mt-2 inline-block rounded-full border border-primary px-4 py-0.5 text-xs font-bold">
                        Ou retirada em loja!
                    </p>
                </div>
                <Image
                    src="/brand/van.png"
                    alt=""
                    width={1000}
                    height={574}
                    className="w-40 md:w-72"
                />
            </div>
        </section>
    );
}
