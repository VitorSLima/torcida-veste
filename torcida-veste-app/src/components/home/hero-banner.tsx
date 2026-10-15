import Image from 'next/image';

export function HeroBanner() {
    return (
        <section className="bg-gradient-to-r from-[#1b5108] to-[#11280a]">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-center gap-4 px-6 py-8 md:justify-between md:px-16 md:py-10">
                <h1 className="hidden text-5xl font-extrabold leading-tight md:block lg:text-6xl">
                    Ofertas
                    <br />
                    Imperdíveis!
                </h1>
                <Image
                    src="/brand/basket.png"
                    alt=""
                    width={1000}
                    height={1000}
                    priority
                    className="w-28 md:w-64"
                />
                <p className="text-lg leading-tight md:text-xl">
                    até{' '}
                    <span className="text-5xl font-extrabold md:text-7xl">55%</span>
                    <span className="hidden md:inline"> de</span>
                    <br />
                    <strong className="text-3xl font-extrabold md:text-5xl">Desconto</strong>
                    <br />
                    só esse mês
                </p>
            </div>
        </section>
    );
}
