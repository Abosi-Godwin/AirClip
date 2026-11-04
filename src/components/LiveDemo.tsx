import TransferScene from "./TransferScene";

const facts = ["Nothing stored", "Encrypted in transit", "No account"];

const LiveDemo = () => (
    <section id="demo" className="bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-bay-600">
                    See it in action
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
                    Drop a file. It lands on your phone.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
                    This is the whole product. The file goes straight from one
                    browser to the other, encrypted, with nothing uploaded to a
                    server in between.
                </p>

                <ul className="mt-6 flex flex-wrap gap-2">
                    {facts.map(fact => (
                        <li
                            key={fact}
                            className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200/70"
                        >
                            {fact}
                        </li>
                    ))}
                </ul>

                <p className="mt-8 font-mono text-xs uppercase tracking-wider text-neutral-500">
                    Try it: drag the file onto the phone
                </p>
            </div>

            <TransferScene />
        </div>
    </section>
);

export default LiveDemo;
