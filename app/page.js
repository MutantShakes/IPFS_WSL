import Image from 'next/image'
import Dropzone from './components/Dropzone'
import IpfsComponent from './components/ipfs'
import App from './components/helia_webpack'
import Network from './components/networking'

export default function Home() {
  return (
    <>
    <div class='flex justify-center items-center'>
    <Dropzone/>
    </div>

    </>
  )
}
