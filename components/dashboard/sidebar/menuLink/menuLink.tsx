import Image from "next/image"
import Link from "next/link"

const MenuLink = ({ menu }) => {
    return (
        <div >
            {menu.map((item, index) => (
                <Link href={item.link} key={index}   >
                    <div className="flex items-center space-x-2 mt-6 mb-6 ml-4">
                        <Image src={item.icon} alt={menu.title} className="w-3" />
                        <span className="text-sm">{item.title}</span>
                    </div>
                </Link>
            ))}


        </div>
    )
}

export default MenuLink