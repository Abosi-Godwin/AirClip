/*const steps = [
    {
        number: "01",
        title: "Create a room",
        description:
            "One tap opens a private room with a short code. No sign-up, no email, nothing to install.",
        image: "/steps/create.svg"
    },
    {
        number: "02",
        title: "Share the code",
        description:
            "Type the code on your other device or scan the QR. It works across phones, tablets and laptops.",
        image: "/steps/share.svg"
    },
    {
        number: "03",
        title: "Send anything",
        description:
            "Drop in files or paste text. They go straight between your browsers, encrypted, with no cloud storage in between.",
        image: "/steps/transfer.svg"
    }
];

const HowItWorks = () => {
    return (
        <section
            id="how-it-works"
            className="bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
        >
            <div className="mx-auto max-w-7xl rounded-4xl bg-neutral-100 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
                <div className="max-w-3xl">
                    <p className="font-mono text-xs font-medium uppercase tracking-widest text-bay-600">
                        How it works
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl lg:text-5xl">
                        Three steps. Nothing to install.
                    </h2>
                    <p className="mt-4 text-lg text-neutral-600">
                        Open a room, share the code, and your devices talk to
                        each other directly.
                    </p>
                </div>

                <ol className="mt-10 grid grid-cols-1 gap-6 min-[900px]:grid-cols-3 lg:mt-14 lg:gap-8">
                    {steps.map(step => (
                        <li
                            key={step.number}
                            className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200/70 sm:flex-row sm:items-center min-[900px]:flex-col min-[900px]:items-stretch"
                        >
                            <div
                                className="flex items-center justify-center
                            rounded-2xl bg-white p-6 sm:w-2/5 min-[900px]:w-full"
                            >
                                <img
                                    src={step.image}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    className="h-44 w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>

                            <div className="flex flex-1 flex-col gap-2 p-6">
                                <span className="font-mono text-xs font-medium text-bay-600">
                                    {step.number}
                                </span>
                                <h3 className="text-xl font-bold text-neutral-900">
                                    {step.title}
                                </h3>
                                <p className="text-neutral-600">
                                    {step.description}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

export default HowItWorks;
*/
const steps = [
    {
        number: "01",
        title: "Create a room",
        description:
            "One tap opens a private room with a short code. No sign-up, no email, nothing to install.",
        image: "/steps/create.svg"
    },
    {
        number: "02",
        title: "Share the code",
        description:
            "Type the code on your other device or scan the QR. It works across phones, tablets and laptops.",
        image: "/steps/share.svg"
    },
    {
        number: "03",
        title: "Send anything",
        description:
            "Drop in files or paste text. They go straight between your browsers, encrypted, with no cloud storage in between.",
        image: "/steps/transfer.svg"
    }
];

const HowItWorks = () => {
    return (
        <section
            id="how-it-works"
            className="bg-white px-4 py-12 sm:px-6 sm:py-20 lg:px-8"
        >
            <div className="mx-auto max-w-7xl rounded-4xl bg-neutral-100 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
                <div className="max-w-3xl">
                    <p className="font-mono text-xs font-medium uppercase tracking-widest text-bay-600">
                        How it works
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl lg:text-5xl">
                        Three steps. Nothing to install.
                    </h2>
                    <p className="mt-4 text-lg text-neutral-600">
                        Open a room, share the code, and your devices talk to
                        each other directly.
                    </p>
                </div>

                <ol className="mt-10 grid grid-cols-1 gap-6 min-[56.25rem]:grid-cols-3 lg:mt-14 lg:gap-8">
                    {steps.map(step => (
                        <li
                            key={step.number}
                            className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200/70"
                        >
                            <img
                                src={step.image}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                className="h-52 w-full object-contain pt-2"
                            />
                            <div className="flex flex-1 flex-col gap-2 px-6 pb-6">
                                <span className="font-mono text-xs font-medium text-bay-600">
                                    {step.number}
                                </span>
                                <h3 className="text-xl font-bold text-neutral-900">
                                    {step.title}
                                </h3>
                                <p className="text-neutral-600">
                                    {step.description}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

export default HowItWorks;