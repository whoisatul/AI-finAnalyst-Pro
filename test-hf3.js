require('dotenv').config({ path: '.env.local' });
const { HfInference } = require("@huggingface/inference");
const hf = new HfInference(process.env.HF_KEY);
async function testModel(modelId) {
    try {
        await hf.chatCompletion({
            model: modelId,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 10
        });
        console.log(`SUCCESS: ${modelId}`);
    } catch(e) {
        // console.error(`FAIL: ${modelId} - ${e.message}`);
    }
}
async function run() {
    await testModel("Qwen/Qwen2.5-7B-Instruct");
    await testModel("mistralai/Mistral-Nemo-Instruct-2407");
    await testModel("HuggingFaceH4/zephyr-7b-beta");
    await testModel("meta-llama/Llama-3.2-1B-Instruct");
    await testModel("meta-llama/Llama-2-7b-chat-hf");
    await testModel("NousResearch/Hermes-3-Llama-3.1-8B");
}
run();
