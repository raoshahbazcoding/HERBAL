"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Leaf, ShieldCheck, Star } from "lucide-react";

export default function DiaboControlPage() {
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      console.log("Order submitted:", formData);
      setIsSubmitting(false);
      setFormData({ name: "", phone: "" });
      alert("آرڈر کامیابی سے جمع ہو گیا!");
    }, 1000);
  };

  const testimonial = {
    name: "قاسم علی شاہ",
    age: 43,
    content:
      "“دوسرے ڈاکٹر ڈائیبو کنٹرول نامی ایک شاندار دوا لوگوں سے کیوں چھپاتے ہیں؟ مجھے انتہائی ذیابیطس تھا۔ یہ 18 سال تک میرا ساتھی تھا۔ اب میری عمر 43 سال ہے۔ حال ہی میں اس سے آنکھ اور گردے کی شدید پیچیدگیاں پیدا ہوئی ہیں۔ میرے گردے بمشکل کام کر رہے تھے، اور مجھے ایسیٹون کی بو آ رہی تھی۔ میری بیوی میرے ساتھ ایک ہی کمرے میں نہیں رہ سکتی۔ یہ ہمیشہ پاؤں کے السر کے ساتھ ہوتا ہے، پاؤں اور انگلیوں کا سیاہ ہونا۔ میں اصل میں مر رہا تھا. ہمارے ڈاکٹروں نے کہا کہ میرے پاس زیادہ وقت نہیں ہے۔ میں نے اپنی بیوی سے اپنے آخری دنوں کے بارے میں سوچنے کو کہا۔ میری زندگی اچھی تھی، لیکن میں مرنا نہیں چاہتا۔ یہاں تک کہ جب میں ہسٹریکس میں چیخا کہ میں مرنا چاہتا ہوں، میرا یہ مطلب نہیں تھا۔ میں جانتا تھا کہ ڈائیبو کنٹرول ذیابیطس کا کامیابی سے علاج کر رہے ہیں، لیکن پھر بھی کسی نہ کسی طرح میں آخر میں یقین نہیں کر سکتا تھا - چونکہ، سب کہتے ہیں کہ اس کا علاج نہیں ہو سکتا، میں صرف اپنا وقت ضائع کروں گا۔ میں نے اسے جلدی سے لینا شروع کیا۔ اس لمحے کو 4 ماہ گزر چکے ہیں اور میں ابھی تک زندہ ہوں۔ اور ڈاکٹروں کا کہنا ہے کہ مجھے ابھی موت کی فکر نہیں کرنی چاہیے کیونکہ میرا بلڈ شوگر لیول نارمل ہے۔ لیکن میں خود محسوس کرتا ہوں۔ میں نے 10 سالوں میں کبھی اتنا صحت مند اور ذیابیطس سے پاک محسوس نہیں کیا جتنا میں اب کرتا ہوں! میں بہتر سونے لگا، شدید پیاس کا احساس ختم ہو گیا، بیت الخلا میں میرا بار بار جانا بند ہو گیا، تھکاوٹ اور مسلسل کمزوری بغیر کسی نشان کے غائب ہو گئی۔ دباؤ بڑھنا بند ہو گیا ہے۔ میری نظر میں بہتری آئی ہے۔ میں نے ابھی اپنا علاج مکمل نہیں کیا ہے، لیکن مجھے یقین ہے کہ میں یہ جنگ جیت جاؤں گا۔ ڈائیبو کنٹرول کے لیے آپ کا بہت شکریہ۔”",
    rating: 5,
  };

  return (
    <div className="flex flex-col justify-center min-h-screen" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center">
        <div className="container flex h-16 items-center justify-between">
          <Link className="flex items-center justify-center gap-2" href="/">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="font-bold text-xl">ڈائیبو کنٹرول</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#order">
              <Button className="bg-green-600 hover:bg-green-700">ابھی آرڈر کریں</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-green-50 to-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="inline-flex rounded-md px-3.5 py-1.5 text-sm font-medium bg-green-100 text-green-800">
                    محدود پیشکش
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    <span className="text-green-600">ڈائیبو کنٹرول</span> کے ساتھ ذیابیطس سے چھٹکارا حاصل کریں
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    ٹائپ 2 ذیابیطس کے لیے دنیا کی پہلی قدرتی دوا جو انسولین مزاحمت کو کم کرتی ہے اور آپ کی زندگی کو بہتر بناتی ہے۔ صرف <span className="font-bold text-green-600">6499 PKR</span> میں!
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/products">
                    <Button size="lg" className="group bg-green-600 hover:bg-green-700">
                      ابھی آرڈر کریں
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="#details">
                    <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      مزید جانیں
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-muted sm:h-[450px] lg:h-[500px]">
                  <img
                    alt="ڈائیبو کنٹرول"
                    className="object-cover w-full h-full transition-all hover:scale-105 duration-500"
                    src="IMG-20250416-WA0000.jpg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details Section */}
        <section id="details" className="w-full py-12 md:py-24 bg-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  ڈائیبو کنٹرول
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  ذیابیطس کے خلاف ایک انقلابی حل
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ڈائیبو کنٹرول سنگاپور کے انسٹی ٹیوٹ آف اینڈوکرائنولوجی کی تیار کردہ ایک قدرتی اینٹی ذیابیطس کمپلیکس ہے، جس میں 60 فعال اجزاء اور 28 جڑی بوٹیوں کے عرق شامل ہیں۔
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-white border-2 border-muted transition-all duration-200 hover:border-green-200 hover:shadow-md">
                <CardHeader className="p-4 pb-2 flex flex-col items-center">
                  <CheckCircle className="h-10 w-10 text-green-600 mb-4" />
                  <CardTitle className="text-xl text-center">انسولین مزاحمت کم کرتا ہے</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    خلیات کو انسولین کے لیے زیادہ حساس بناتا ہے، خون میں شوگر کی سطح کو محفوظ طریقے سے کم کرتا ہے۔
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-muted transition-all duration-200 hover:border-green-200 hover:shadow-md">
                <CardHeader className="p-4 pb-2 flex flex-col items-center">
                  <ShieldCheck className="h-10 w-10 text-green-600 mb-4" />
                  <CardTitle className="text-xl text-center">میٹابولزم کو معمول پر لاتا ہے</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    کاربوہائیڈریٹ میٹابولزم کو بحال کرتا ہے اور جگر، لبلبہ کے کام کو بہتر بناتا ہے۔
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-muted transition-all duration-200 hover:border-green-200 hover:shadow-md">
                <CardHeader className="p-4 pb-2 flex flex-col items-center">
                  <Leaf className="h-10 w-10 text-green-600 mb-4" />
                  <CardTitle className="text-xl text-center">قدرتی اور محفوظ</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    100% قدرتی اجزاء سے تیار، بغیر کسی نقصان دہ کیمیکلز کے۔
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-center mb-4">ڈائیبو کنٹرول کے 5 اہم اقدامات</h3>
              <ul className="list-disc list-inside text-right space-y-2 text-muted-foreground">
                <li>لبلبہ میں بیٹا خلیوں کو متحرک کرتا ہے۔</li>
                <li>میٹابولک عمل کو معمول پر لاتا ہے، تائرواڈ اور بیضہ دانی کی خرابی کو روکتا ہے۔</li>
                <li>خون میں فاسفورس کی سطح کو معمول پر لاتا ہے۔</li>
                <li>خون اور لمف کو صاف کرتا ہے۔</li>
                <li>قوت مدافعت کی حمایت کرتا ہے اور بصارت کی خرابی کو روکتا ہے۔</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Expert Opinions Section */}
        <section className="w-full py-12 md:py-24 bg-green-50 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  ماہرین کی رائے
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  ڈاکٹروں کی سفارشات
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  پاکستان کے معروف ماہرین ذیابیطس ڈائیبو کنٹرول کی تاثیر کی تصدیق کرتے ہیں۔
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2">
              <Card className="bg-white border-none shadow-md">
                <CardHeader>
                  <CardTitle>ڈاکٹر ثانیہ نشتر</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    “آج، آپ کی دوائیں عملی طور پر میٹفارمین پر مبنی ہیں۔ تاہم، یہ ایک غلط فہمی ہے جو ان پڑھ مریضوں اور ڈاکٹروں دونوں میں شامل ہیں۔ میٹفارمین بیماری اور وقت سے پہلے موت کا یقینی راستہ ہے۔ ڈائیبو کنٹرول ایک قدرتی حل ہے جو ٹائپ 2 ذیابیطس کا علاج کرتا ہے بغیر جسم کو نقصان پہنچائے۔”
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-md">
                <CardHeader>
                  <CardTitle>پروفیسر ڈاکٹر جاوید اقبال</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    “ڈائیبو کنٹرول کی کارکردگی غیر معمولی ہے! جب ہم نے اپنے مریضوں کو یہ علاج تجویز کرنا شروع کیا تو علاج کی شرح 96 فیصد تھی۔ اس کا مطلب ہے کہ 100 میں سے 96 لوگوں نے اپنی ذیابیطس کو الوداع کہا۔”
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-md">
                <CardHeader>
                  <CardTitle>پروفیسر ابوالبیست، ڈائریکٹر، باقائی انسٹی ٹیوٹ آف ڈائیبیٹولوجی اینڈ اینڈوکرائنولوجی</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    “ذیابیطس کے لیے جدید ادویات کا مقصد بیماری کی علامات کو ختم کرنا ہے نہ کہ اسباب کو۔ ڈائیبو کنٹرول علاج کا مقصد طویل مدتی علاج ہے۔ پہلے ہی کورس کے بعد، ذیابیطس کی علامات آہستہ آہستہ غائب ہو جاتی ہیں، جسم کے تمام نظاموں کا کام بحال ہو جاتا ہے۔”
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Risks of Diabetes Section */}
        <section className="w-full py-12 md:py-24 bg-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  ذیابیطس کے خطرات
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  ذیابیطس آپ کی زندگی کو کیسے تباہ کرتی ہے
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ذیابیطس ایک سنگین بیماری ہے جو جسم کے تمام نظاموں کو متاثر کرتی ہے۔ اگر علاج نہ کیا جائے تو یہ مہلک نتائج کا باعث بن سکتی ہے۔
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>اندھا پن</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ذیابیطس ریٹینل ڈیٹیچمنٹ کا باعث بنتی ہے، جو مستقل اندھے پن کا سبب بن سکتی ہے۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>گردے کی خرابی</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    زیادہ شوگر گردوں کو تباہ کرتی ہے، جس سے گردے کی ناکامی یا مکمل نقصان ہو سکتا ہے۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>جوڑوں کی خرابی</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    خون کی نالیوں کی بندش جوڑوں کی حرکت کو روکتی ہے، شدید درد اور معذوری کا باعث بنتی ہے۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>اعصابی نظام کی خرابی</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ذیابیطس دماغی مسائل اور جذباتی عدم استحکام کا باعث بنتی ہے، جیسے ڈپریشن۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>جلد کا انفیکشن</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ذیابیطس جلد کو سڑنے، السر اور گینگرین کا شکار بناتی ہے۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>دل اور شریانیں</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ہائی بلڈ پریشر اور کولیسٹرول پلاک دل کے دورے اور اسٹروک کا خطرہ بڑھاتے ہیں۔
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="w-full py-12 md:py-24 bg-green-50 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  صارف کی رائے
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  ہمارے صارفین کیا کہتے ہیں
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ڈائیبو کنٹرول نے ہزاروں لوگوں کی زندگیاں بدل دی ہیں۔ ان کی کہانی سنیں۔
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-4xl mt-12">
              <Card className="bg-white border-none shadow-md">
                <CardContent className="pt-10 pb-10 px-6 md:px-10">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    <blockquote className="text-lg md:text-xl italic mb-4">"{testimonial.content}"</blockquote>
                    <div>
                      <p className="font-semibold">{testimonial.name}, {testimonial.age} سال</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Order Form Section */}
        <section id="order" className="w-full py-12 md:py-24 bg-green-700 text-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  آج ہی ڈائیبو کنٹرول آرڈر کریں!
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  محدود وقت کے لیے پروموشنل قیمت: <span className="font-bold">6499 PKR</span>
                </p>
              </div>
              <div className="w-full max-w-md bg-white rounded-lg p-6 text-right">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      ملک
                    </label>
                    <input
                      type="text"
                      id="country"
                      value="پاکستان"
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-600 focus:ring-green-600 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      آپ کا نام
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-600 focus:ring-green-600 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      ٹیلی فون
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-600 focus:ring-green-600 sm:text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "جمع ہو رہا ہے..." : "ڈائیبو کنٹرول آرڈر کریں"}
                  </Button>
                </form>
              </div>
              <p className="text-sm">ڈیلیوری پورے پاکستان میں کی جاتی ہے۔</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-white py-12 flex justify-center">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                <span className="font-bold text-xl">ڈائیبو کنٹرول</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ذیابیطس کے مریضوں کے لیے قدرتی اور موثر علاج۔
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">فوری لنکس</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#details" className="text-muted-foreground hover:text-green-600 transition-colors">
                    پروڈکٹ کی تفصیلات
                  </Link>
                </li>
                <li>
                  <Link href="#order" className="text-muted-foreground hover:text-green-600 transition-colors">
                    آرڈر کریں
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">رابطے میں رہیں</h3>
              <p className="text-sm text-muted-foreground mb-4">
                اپ ڈیٹس اور خصوصی پیشکشوں کے لیے ہمارے نیوز لیٹر کو سبسکرائب کریں۔
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="آپ کا ای میل"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  سبسکرائب کریں
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 text-center">
            <p className="text-xs text-muted-foreground">© 2025 ڈائیبو کنٹرول۔ جملہ حقوق محفوظ ہیں۔</p>
          </div>
        </div>
      </footer>
    </div>
  );
}