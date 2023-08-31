'use client'

// imports ---------------------------------------------------------------------

import React, {useMemo} from 'react';
import {useDropzone} from 'react-dropzone';
import { useCallback, useState, useEffect } from "react";
import { unixfs } from '@helia/unixfs'
import { createHelia } from 'helia'
import { MemoryBlockstore } from 'blockstore-core'
import {createNode} from './networking'
import { concat } from 'uint8arrays/concat'

// ----------------------------------------------------------------------------

// styling dropzone -----------------------------------------------------------

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out'
};

const focusedStyle = {
  borderColor: '#2196f3'
};

const acceptStyle = {
  borderColor: '#00e676'
};

const rejectStyle = {
  borderColor: '#ff1744'
};

// -----------------------------------------------------------------------------


// reading File ---------------------------------------------------------------

async function readFileAsUint8Array (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const arrayBuffer = reader.result
      if (arrayBuffer != null) {
        if (typeof arrayBuffer === 'string') {
          const uint8Array = new TextEncoder().encode(arrayBuffer)
          resolve(uint8Array)
        } else if (arrayBuffer instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(arrayBuffer)
          resolve(uint8Array)
        }
        return
      }
      reject(new Error('arrayBuffer is null'))
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsArrayBuffer(file)
  })
}

//-----------------------------------------------------------------------------


// ---------------------------------------------------------------------------


// Function
export default function Dropzone(props) {


// useState---------------------------------------------------------------------

  const [output, setOutput] = useState(null)
  const[file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null)
  const [id, setId] = useState(null)
  const [cidd,setCid] =useState(null)
  const [helia, setHelia] = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  const [path,setPath] = useState(null)
  const [output_text,setText] = useState(null)
  const [cidName,setCidName] = useState(null)
  const [ufs,setFs] = useState(null)

// -----------------------------------------------------------------------------


// MemoryBlockstore------------------------------------------------------------
const blockstore = new MemoryBlockstore()
// ---------------------------------------------------------------------------

// handling file submit -------------------------------------------------------

  const onDrop = useCallback(acceptedFiles => {

    setFile(acceptedFiles[0]);
  },[])

  // --------------------------------------------------------------------------




  //  setting heliaNode -------------------------------------------------------

  useEffect(() => {
    const init = async () => {
      if (helia) return

      setOutput("Creating Helia Node")
      const heliaNode = await createHelia({
        blockstore
      })

      const nodeId = heliaNode.libp2p.peerId.toString()
      const nodeIsOnline = heliaNode.libp2p.isStarted()

      setHelia(heliaNode)
      setId(nodeId)
      setIsOnline(nodeIsOnline)
    }
    init()
    if(isOnline) setOutput("Node Online....")
  }, [helia,isOnline])

//  ----------------------------------------------------------------------



// adding file (getting cid) --------------------------------------------------
  useEffect(() => {
    if(file){
      const init = async() =>{
      const encoder = new TextEncoder()

      const fs = unixfs(helia)

      setFs(fs)

      setOutput(`Adding file...`)



      const cid = await fs.addBytes(await readFileAsUint8Array(file))

      setCid(cid)

      setOutput(`Added to ${cid}`)





       // Retrieve the file from IPFS
       // const stream = fs.cat(cid);
       //
       // let data = Buffer.alloc(0);
       //
       // for await (const chunk of stream) {
       //   data = Buffer.concat([data, chunk]);
       //
       // }

// ---------------------------------
      // for await (const chunk of fs.cat(cid)) {
      //   const c = (chunk,{stream: true})
      //   let ff = new Uint8Array(concatenate(Uint8Array,
      //       data, c))
      //   console.info(c)
      // }
// ---------------------------------

      // console.log("data is:",data)
      //
      // setText(data.buffer)
      // console.log(data.buffer)
      setOutput(`Preview: https://ipfs.io/ipfs/${cid}`)
      }
      init()
    }



}, [file])

useEffect(() =>{

  if(cidName){
    setOutput('Reading file...')
    const init = async() =>{
      // Retrieve the file from IPFS
      const fs = unixfs(helia)
      const stream = fs.cat(cidName);

      let data = Buffer.alloc(0);

      for await (const chunk of stream) {
        data = Buffer.concat([data, chunk]);

      }


     console.log("data is:",data)

     setText(data.buffer)
     console.log(data.buffer)
     setOutput("Data Read")
    }

    init()
  }

},[cidName])

// -----------------------------------------------------------------------------


// Downloading file -----------------------------------------------------------------------------

const downloadFile = useCallback(async () => {
  if (output_text == null) {
    return
  }
  const blob = new Blob([output_text])

  console.log("bolb is:",blob)

  const downloadEl = document.createElement('a')
  const blobUrl = window.URL.createObjectURL(blob)
  downloadEl.href = blobUrl
  downloadEl.download = 'test.txt'
  document.body.appendChild(downloadEl)

  downloadEl.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
  );
  setTimeout(() => {
  // For Firefox it is necessary to delay revoking the ObjectURL
  window.URL.revokeObjectURL(blobUrl);

}, 100);

}, [output_text])


// -----------------------------------------------------------------------------


// dropzone -------------------------------------------------------------------
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject
  } = useDropzone({
    maxFiles: 1,
    onDrop,
  });

// style
  const style = useMemo(() => ({
    ...baseStyle,
    ...(isFocused ? focusedStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isFocused,
    isDragAccept,
    isDragReject
  ]);

  // ---------------------------------------------------------------------------




  return (
    <div className="container">

      <div {...getRootProps({style})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
      <div>
      <input type='text' value={cidName} onChange={(e) => setCidName(e.target.value)} placeholder="cid........."/>
      {output ? (<p>{output}</p>):(<p>Add file</p>)} <hr></hr>
      {output_text ? (<button onClick={downloadFile}>Download File</button>):(<p>nothing</p>)}<hr></hr>
      {output_text ? (<p>Added</p>):(<p>nothing</p>)}<hr></hr>

      {isOnline ? (<p>{id}</p>):(<p>Not Online</p>)}
      </div>
    </div>
  );
}
