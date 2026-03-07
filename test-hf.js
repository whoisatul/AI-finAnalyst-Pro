require('dotenv').config({ path: '.env.local' });
const { HfInference } = require("@huggingface/inference");

const hf = new HfInference(process.env.HF_KEY);

async function testModel(modelId) {
    try {
        console.log(`Testing ${modelId}...`);
        const res = await hf.chatCompletion({
            model: modelId,
            messages: [{ role: "user", content: "Say 'hello'" }],
            max_tokens: 10
        });
        console.log(`✅ Success for ${modelId}:`, res.choices[0].message.content);
        return true;
    } catch (e) {
        console.log(`❌ Failed for ${modelId}:`, e.message);
        return false;
    }
}

async function run() {
    const models = [
        "HuggingFaceH4/zephyr-7b-beta",
        "meta-llama/Llama-3.2-1B-Instruct",
        "microsoft/Phi-3-mini-4k-instruct",
        "Qwen/Qwen2.5-72B-Instruct"
    ];
    for (const m of models) {
        if (await testModel(m)) break;
    }
}
run();
