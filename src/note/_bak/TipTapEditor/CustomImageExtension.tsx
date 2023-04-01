// import { mergeAttributes, Node } from "@tiptap/core";
// import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
// import { useLiveQuery } from "dexie-react-hooks";
// import { db } from "../../db";

// function CustomImage(props: any) {
//   console.log('custom-image', props)
//   const img = useLiveQuery(() => {
//     return db.images.get(Number(props.node.attrs.id));
//   }, [props.node.attrs.id]);
//   return (
//     <NodeViewWrapper className="custom-image">
//       <img src={img?.url} />
//     </NodeViewWrapper>
//   );
// }
// export const CustomImageExtension = Node.create({
//   name: "CustomImage",

//   group: "block",

//   atom: true,

//   addAttributes() {
//     return {
//       id: {
//         default: 0,
//       },
//     };
//   },

//   parseHTML() {
//     return [
//       {
//         tag: "custom-image",
//       },
//     ];
//   },

//   renderHTML({ HTMLAttributes }) {
//     return ["custom-image", mergeAttributes(HTMLAttributes)];
//   },

//   addNodeView() {
//     return ReactNodeViewRenderer(CustomImage);
//   },
// });

export {}
