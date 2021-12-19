const { exec } = require("child_process");

exports.create = async (req, res) => {
  const fileName = req.body["fileName"];
  const pathName = req.body["path"];

  console.log("DEBUG::", fileName);
  let command = `rsync -azP root@104.207.133.53:${pathName}/${fileName} /Users/$(whoami)/Downloads`;

  const call = await exec(command);

  call.stdout.once("data", (data) => {
    console.log(`stdout: ${data}`);
    return res.status(200).send({ data: data, status: 200 });
  });

  call.stderr.once("data", (data) => {
    console.log(`stderr: ${data}`);
    return res.status(500).send({ data: data, status: 500 });
  });

  call.once("error", (error) => {
    console.log(`error: ${error.message}`);
  });

  call.once("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
};
