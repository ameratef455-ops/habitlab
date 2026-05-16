import { env, pipeline } from '@xenova/transformers';

// Force remote models since we don't have local assets
env.allowLocalModels = false;
env.useBrowserCache = true;

let classifier: any = null;
let isLoading = false;

export const analyzePlan = async (data: string) => {
  if (!classifier) {
    await preloadModel();
  }
  const plan = JSON.parse(data);
  const mlResult = await classifier(data.substring(0, 512)); // Take first 512 chars for model
  
  // Heuristic evaluation logic
  const commitment = plan.habits ? (plan.habits.filter((h: any) => h.completed).length / (plan.habits.length || 1)) : 0;
  const efficiency = plan.focusSessions ? (plan.focusSessions.reduce((acc: any, s: any) => acc + (s.duration || 0), 0) / 60) : 0;

  return {
    mlResult,
    commitment: {
      score: commitment,
      text: commitment > 0.7 ? "أنت ماشي زي الفل، التزامك عالي جداً!" : (commitment > 0.4 ? "حاول تشد حيلك شوية، التزامك متوسط." : "يا صديقي الإلتزام واقع خالص، ركز معانا.")
    },
    efficiency: {
      score: efficiency,
      text: efficiency > 5 ? "كفاءتك في التركيز ممتازة، كمل." : "أداءك في الجلسات محتاج شوية تنظيم وتزود وقت التركيز."
    },
    strengths: plan.generalNotes?.slice(0, 2) || ["مفيش ملاحظات كتير بس شكلك مجتهد"],
    weaknesses: plan.plannerData?.slice(0, 2) || ["محتاجين تنظيم أكتر في جدول اليوم"]
  };
};

export const preloadModel = async () => {
  if (classifier || isLoading) return;
  isLoading = true;
  try {
    // multilingual bert for classification/analysis
    // Using a simpler model to verify if the issue is related to model size or URL resolution
    classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
  } catch (err) {
    console.error('Failed to load model:', err);
  } finally {
    isLoading = false;
  }
};

export const isModelLoaded = () => !!classifier;
