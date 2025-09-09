import React from 'react'

type AlertsAndInsightsProps = {
    alerts: string
}

export const AlertsAndInsights: React.FC<AlertsAndInsightsProps> = ({ alerts }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mt-2">
            <p className="text-lg text-gray-900 py-2">
                Alerts & Insights - Coming Soon
            </p>
            {/* <p className="text-gray-950">{alerts}</p> */}
        </div>
    )
}
