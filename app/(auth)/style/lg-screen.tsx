import Image from "next/image"
import { AuthFooter } from "./footer/footer"
import whitefullname from "@/public/Whitefullname.png"

export const LgScreen = () => {
    return (
        <div className="relative flex min-h-full w-full flex-col justify-between overflow-hidden bg-[#4a48ff] px-10 py-10">
            <div className="pointer-events-none absolute inset-0">
                {[
                    "left-[8%] top-[10%] h-1 w-1",
                    "left-[5%] top-[22%] h-0.5 w-0.5",
                    "left-[7%] top-[48%] h-1.5 w-1.5",
                    "left-[18%] top-[22%] h-1.5 w-1.5",
                    "left-[20%] top-[7%] h-0.5 w-0.5",
                    "left-[23%] top-[42%] h-1 w-1",
                    "left-[34%] top-[8%] h-1 w-1",
                    "left-[36%] top-[31%] h-0.5 w-0.5",
                    "left-[41%] top-[18%] h-1 w-1",
                    "left-[46%] top-[63%] h-0.5 w-0.5",
                    "left-[54%] top-[8%] h-0.5 w-0.5",
                    "left-[62%] top-[14%] h-1 w-1",
                    "left-[67%] top-[36%] h-1.5 w-1.5",
                    "left-[72%] top-[58%] h-0.5 w-0.5",
                    "left-[80%] top-[26%] h-1.5 w-1.5",
                    "left-[91%] top-[13%] h-1 w-1",
                    "left-[10%] top-[54%] h-1 w-1",
                    "left-[14%] top-[66%] h-0.5 w-0.5",
                    "left-[30%] top-[70%] h-1.5 w-1.5",
                    "left-[39%] top-[84%] h-1 w-1",
                    "left-[52%] top-[78%] h-0.5 w-0.5",
                    "left-[65%] top-[88%] h-1.5 w-1.5",
                    "left-[74%] top-[74%] h-1 w-1",
                    "left-[83%] top-[67%] h-0.5 w-0.5",
                    "left-[88%] top-[86%] h-1.5 w-1.5",
                    "left-[16%] top-[88%] h-1 w-1",
                ].map((position) => (
                    <span key={position} className={`absolute rounded-full bg-white/85 ${position}`} />
                ))}
                {[
                    "left-[6%] top-[7%] bg-[#ff4ed8]",
                    "left-[18%] top-[36%] bg-[#ffdc45]",
                    "left-[38%] top-[24%] bg-[#20dca8]",
                    "left-[69%] top-[42%] bg-[#ff5b2d]",
                    "right-[8%] top-[36%] bg-[#27d5ff]",
                    "right-[14%] bottom-[18%] bg-[#ff4ed8]",
                    "left-[12%] bottom-[12%] bg-[#20dca8]",
                ].map((position) => (
                    <span key={position} className={`absolute h-6 w-6 [clip-path:polygon(50%_0,62%_38%,100%_50%,62%_62%,50%_100%,38%_62%,0_50%,38%_38%)] ${position}`} />
                ))}
                <span className="absolute left-[9%] top-[35%] h-12 w-12 border border-white/80 [clip-path:polygon(50%_0,60%_40%,100%_50%,60%_60%,50%_100%,40%_60%,0_50%,40%_40%)]" />
                <span className="absolute right-[13%] top-[48%] h-16 w-16 bg-white [clip-path:polygon(50%_0,60%_40%,100%_50%,60%_60%,50%_100%,40%_60%,0_50%,40%_40%)]" />
                <span className="absolute bottom-[33%] left-[18%] h-8 w-8 border border-white/70 [clip-path:polygon(50%_0,60%_40%,100%_50%,60%_60%,50%_100%,40%_60%,0_50%,40%_40%)]" />
                <span className="absolute right-[7%] top-[70%] h-10 w-10 border border-white/55 [clip-path:polygon(50%_0,60%_40%,100%_50%,60%_60%,50%_100%,40%_60%,0_50%,40%_40%)]" />
                <span className="absolute left-[16%] top-[17%] h-px w-28 rotate-[32deg] bg-white/35" />
                <span className="absolute left-[29%] top-[22%] h-px w-20 rotate-[-42deg] bg-white/35" />
                <span className="absolute left-[15%] top-[48%] h-px w-32 rotate-[14deg] bg-white/30" />
                <span className="absolute left-[24%] top-[53%] h-px w-24 rotate-[-36deg] bg-white/30" />
                <span className="absolute right-[16%] top-[16%] h-px w-44 rotate-[18deg] bg-white/35" />
                <span className="absolute right-[18%] top-[24%] h-px w-36 rotate-[78deg] bg-white/35" />
                <span className="absolute right-[13%] top-[58%] h-px w-32 rotate-[34deg] bg-white/30" />
                <span className="absolute right-[19%] top-[66%] h-px w-24 rotate-[-64deg] bg-white/30" />
                <span className="absolute bottom-[14%] left-[48%] h-px w-32 rotate-[-22deg] bg-white/35" />
                <span className="absolute bottom-[21%] left-[56%] h-px w-36 rotate-[82deg] bg-white/35" />
            </div>

            <div className="relative z-10">
                <Image src={whitefullname} alt="Pocket shuttle" width={230} height={72} priority />
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-8">
                <div className="relative flex min-h-[390px] w-full max-w-[560px] items-center justify-center">
                    <span className="absolute left-[8%] top-[24%] rounded-full bg-[#20dca8] px-3 py-1 text-sm font-black text-[#071126] -rotate-12">
                        Track
                    </span>
                    <span className="absolute right-[10%] top-[18%] rounded-full bg-[#ffcf32] px-3 py-1 text-sm font-black text-[#071126] rotate-12">
                        Safe
                    </span>
                    <Image
                        src="/images/buus.png"
                        alt="Pocket Shuttle school bus"
                        width={620}
                        height={520}
                        priority
                        className="h-auto w-full max-w-[520px]"
                    />
                </div>
            </div>

            <div className="relative z-10 mx-auto max-w-lg pb-4 text-center">
                <h2 className="text-4xl font-extrabold leading-tight text-white">
                    Smarter school runs,
                    <span className="block">all in one place</span>
                </h2>
                <div className="mt-8 flex items-center justify-center gap-2">
                    <span className="h-2 w-10 rounded-full bg-white" />
                    <span className="h-2 w-2 rounded-full bg-white/80" />
                    <span className="h-2 w-2 rounded-full bg-white/80" />
                </div>
            </div>

            <div className="relative z-10 pt-4">
                <AuthFooter />
            </div>
        </div>
    )
}
