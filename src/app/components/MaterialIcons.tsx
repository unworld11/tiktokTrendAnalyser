'use client'

export default function MaterialIcons() {
  return (
    <>
      <link 
        href="https://fonts.googleapis.com/icon?family=Material+Icons" 
        rel="stylesheet"
      />
      <style jsx global>{`
        /* Fix for material icons vertical alignment */
        .material-icons {
          display: inline-flex;
          vertical-align: middle;
          line-height: 1;
        }
      `}</style>
    </>
  );
} 