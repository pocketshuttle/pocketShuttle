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
        <div>
            <nav className="flex w-full bg-white items-center justify-center space-x-3 text-sm text-slate-500">

                {
                    <>
                        <p
                            onClick={() => handleTab("teachers")}
                            className={`cursor-pointer p-2 eventTab ${activeTab === "about" && "text-slate-900 active"}`}
                        >
                            {tab1}
                        </p>
                        <p
                            onClick={() => handleTab("drivers")}
                            className={`cursor-pointer p-2 eventTab ${activeTab === "bank" && "text-slate-900 active"}`}
                        >
                            {tab2}
                        </p>
                    </>

                }

            </nav>
        </div>
    )
}

export default Tab
