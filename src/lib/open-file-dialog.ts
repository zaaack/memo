export function openFileDialog(
  opts: {
    multiple?: boolean;
    accept?: string;
  },
  cb: (files: FileList | null) => void
) {
  var input = document.createElement("input");

  if (opts.multiple) input.setAttribute("multiple", "");
  if (opts.accept) input.setAttribute("accept", opts.accept);
  input.setAttribute("type", "file");
  input.style.display = "none";

  input.addEventListener("change", function (e) {
    cb(input.files);
    input.remove();
  });

  document.body.appendChild(input);
  input.click()
}
