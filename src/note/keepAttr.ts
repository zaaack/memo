// import ReactQuill from "react-quill";

// let BlockEmbed = ReactQuill.Quill.import("blots/block/embed");

// class ImageBlot extends BlockEmbed {
//   static create(value: any) {
//     let node = super.create();
//     console.log('create', arguments)
//     if (typeof value === 'string') {
//       value = { src:value }
//     }
//     node.setAttribute('id', value.id);
//     return node;
//   }

//   static value(node: any) {
//     console.log('value', node)
//     return {
//       id: node.getAttribute('id'),
//     };
//   }
// }
// ImageBlot.blotName = 'custom-image';
// ImageBlot.tagName = 'custom-image';

// ReactQuill.Quill.register(ImageBlot);

export {}
