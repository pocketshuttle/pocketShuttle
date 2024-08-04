"use client"
type TabType = {
    handleTab: (tab: string) => void,
    activeTab?: string,
    tab1?: string,
    tab2?: string,


}


const Tab = (props: TabType) => {
    const { handleTab, activeTab, tab1, tab2 } = props


    return (
        <div >
            <nav className="flex bg-[var(--hoverBg)] m-auto w-[30%] items-center justify-center space-x-3 text-sm p-2 rounded-lg">

                {
                    <>
                        <p
                            onClick={() => handleTab("teachers")}
                            className={`cursor-pointer p-2 eventTab  px-16 capitalize text-gray-200
                                ${activeTab ===
                                "teachers" && " text-gray-900 inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground active"}`}
                        >
                            {tab1}
                        </p>
                        <p
                            onClick={() => handleTab("drivers")}
                            className={`cursor-pointer p-2 eventTab px-16 text-gray-300 capitalize  ${activeTab ===
                                "drivers" && "text-gray-800 inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground active"}`}
                        >
                            {tab2}
                        </p>
                    </>

                }

            </nav>
        </div >
    )
}

export default Tab
