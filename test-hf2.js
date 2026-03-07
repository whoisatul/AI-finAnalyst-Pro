require('dotenv').config({ path: '.env.local' });
const { HfInference } = require("@huggingface/inference");
const hf = new HfInference(process.env.HF_KEY);
async function test() {
    try {
        const res = await hf.chatCompletion({
            model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 10
        });
        console.log("SUCCESS");
    } catch(e) {
        console.error(e.message);
    }
}
test();
