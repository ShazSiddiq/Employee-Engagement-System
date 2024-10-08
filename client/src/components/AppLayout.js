import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const AppLayout = ({ children }) => {
    return (
        <div className='bg-white'>
            
            <div className='flex container mx-auto' style={{ height: 'calc(100vh - 56px)',paddingTop:"80px" }}>
                <div className="w-[230px]">
                    <Sidebar />
                </div>
                <div className="flex-1">
                    <div className="flex">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppLayout