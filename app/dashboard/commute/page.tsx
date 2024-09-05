import CommuteUI from '@/components/commute/commute'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Commute page",
  description: "Shows the details of of the passengers in the buses  "
}

const page = async () => {

  return (
    <div>
      <CommuteUI />
    </div>
  )
}

export default page