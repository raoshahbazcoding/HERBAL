"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProducts } from "@/lib/firebase/products"
import { getCategories } from "@/lib/firebase/categories"
import { getActiveOffers } from "@/lib/firebase/offers"
import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Leaf, ShieldCheck, Star, Truck } from "lucide-react"

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeOffers, setActiveOffers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [activeCategory, setActiveCategory] = useState("all")
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, offersData] = await Promise.all([
          getProducts(),
          getCategories(),
          getActiveOffers(),
        ])

        let featuredProducts = productsData.filter((product) => product.featured)

        if (featuredProducts.length < 5) {
          const nonFeaturedProducts = productsData
            .filter((product) => !product.featured)
            .slice(0, 5 - featuredProducts.length)

          featuredProducts = [...featuredProducts, ...nonFeaturedProducts]
        }

        featuredProducts = featuredProducts.slice(0, 5)

        const productsWithOffers = featuredProducts.map((product) => {
          const applicableOffers = offersData.filter((offer) => {
            if (offer.productIds?.includes(product.id)) return true
            if (offer.categoryIds?.includes(product.categoryId)) return true
            return false
          })

          let bestDiscount = 0
          let bestOffer = null

          applicableOffers.forEach((offer) => {
            if (offer.discountPercentage > bestDiscount) {
              bestDiscount = offer.discountPercentage
              bestOffer = offer
            }
          })

          if (bestOffer) {
            const originalPrice = product.price
            const discountAmount = (originalPrice * bestDiscount) / 100
            const discountedPrice = originalPrice - discountAmount

            return {
              ...product,
              originalPrice,
              discountPercentage: bestDiscount,
              price: discountedPrice,
            }
          }

          return product
        })

        if (productsWithOffers.length === 0) {
          const placeholderProducts = [
            {
              id: "placeholder1",
              name: "جڑی بوٹیوں کا چائے کا مرکب",
              description: "آرام اور تندرستی کے لیے نامیاتی جڑی بوٹیوں کا ایک پرسکون مرکب۔",
              price: 19.99,
              imageUrl: "/placeholder.svg?height=300&width=300&text=Herbal+Tea",
              categoryId: "placeholder",
            },
            {
              id: "placeholder2",
              name: "قدرتی جڑی بوٹیوں کا عرق",
              description: "طاقتور اینٹی آکسیڈنٹ خصوصیات کے ساتھ خالص جڑی بوٹیوں کا عرق۔",
              price: 29.99,
              imageUrl: "/placeholder.svg?height=300&width=300&text=Herbal+Extract",
              categoryId: "placeholder",
            },
            {
              id: "placeholder3",
              name: "نامیاتی جڑی بوٹیوں کا ضمیمہ",
              description: "100% نامیاتی جڑی بوٹیوں سے بنایا گیا روزانہ کا ضمیمہ۔",
              price: 39.99,
              imageUrl: "/placeholder.svg?height=300&width=300&text=Herbal+Supplement",
              categoryId: "placeholder",
            },
          ]
          setProducts(placeholderProducts)
        } else {
          setProducts(productsWithOffers)
        }

        setCategories(categoriesData)
        setActiveOffers(offersData)
      } catch (error) {
        console.error("Error fetching data:", error)
        const placeholderProducts = [
          {
            id: "placeholder1",
            name: "جڑی بوٹیوں کا چائے کا مرکب",
            description: "آرام اور تندرستی کے لیے نامیاتی جڑی بوٹیوں کا ایک پرسکون مرکب۔",
            price: 19.99,
            imageUrl: "/placeholder.svg?height=300&width=300&text=Herbal+Tea",
            categoryId: "placeholder",
          },
          {
            id: "placeholder2",
            name: "قدرتی جڑی بوٹیوں کا عرق",
            description: "طاقتور اینٹی آکسیڈنٹ خصوصیات کے ساتھ خالص جڑی بوٹیوں کا عرق۔",
            price: 29.99,
            imageUrl: "/placeholder.svg?height=300&width=300&text=Herbal+Extract",
            categoryId: "placeholder",
          },
          {
            id: "placeholder3",
            name: "نامیاتی جڑی بوٹیوں کا ضمیمہ",
            description: "100% نامیاتی جڑی بوٹیوں سے بنایا گیا روزانہ کا ضمیمہ۔",
            price: 39.99,
            imageUrl: "/placeholder.svg?height=300&width=300&text=Herbal+Supplement",
            categoryId: "placeholder",
          },
        ]
        setProducts(placeholderProducts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "غیر زمرہ بند"
  }

  const nextSlide = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: carouselRef.current.offsetWidth, behavior: "smooth" })
    }
  }

  const prevSlide = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -carouselRef.current.offsetWidth, behavior: "smooth" })
    }
  }

  const filteredProducts =
    activeCategory === "all" ? products : products.filter((product) => product.categoryId === activeCategory)

  const testimonials = [
    {
      name: "سارہ جانسن",
      role: "مستقل صارف",
      content:
        "میں نے ایک سال سے زائد عرصے سے ان جڑی بوٹیوں کی مصنوعات استعمال کی ہیں، اور ان کے معیار اور تاثیر سے مسلسل متاثر ہوئی ہوں۔ میری مجموعی صحت میں نمایاں بہتری آئی ہے!",
      avatar: "/placeholder.svg?height=60&width=60&text=SJ",
      rating: 5,
    },
    {
      name: "مائیکل چن",
      role: "صحت کا کوچ",
      content:
        "ایک صحت کے کوچ کے طور پر، میں اپنے تمام گاہکوں کو ان جڑی بوٹیوں کے ضمیموں کی سفارش کرتا ہوں۔ قدرتی اجزاء اور احتیاط سے تیار کردہ فارمولیشنز نے بہت سے لوگوں کو ان کے صحت کے اہداف حاصل کرنے میں مدد کی ہے۔",
      avatar: "/placeholder.svg?height=60&width=60&text=MC",
      rating: 5,
    },
    {
      name: "ایمیلی روڈریگز",
      role: "صحت کی شوقین",
      content:
        "میں نے جو جڑی بوٹیوں کی چائے اور ضمیمے خریدے ہیں وہ میری توقعات سے بڑھ گئے ہیں۔ ان کی تفصیلی مصنوعات کی تفصیلات اور ایماندار جائزوں نے میری صحت کے بارے میں باخبر فیصلے کرنے میں میری مدد کی ہے۔",
      avatar: "/placeholder.svg?height=60&width=60&text=ER",
      rating: 4,
    },
  ]

  const features = [
    {
      icon: <Leaf className="h-10 w-10 text-green-600" />,
      title: "100% قدرتی",
      description: "ہماری تمام مصنوعات خالص، قدرتی جڑی بوٹیوں سے بنائی جاتی ہیں جن میں کوئی مصنوعی اضافہ یا محافظ شامل نہیں ہوتے۔",
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-green-600" />,
      title: "معیار کی جانچ",
      description: "ہر بیچ کی لیبارٹری میں جانچ کی جاتی ہے تاکہ پاکیزگی، طاقت اور آپ کی صحت کے لیے حفاظت کو یقینی بنایا جا سکے۔",
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-green-600" />,
      title: "مصدقہ نامیاتی",
      description: "ہماری جڑی بوٹیاں نامیاتی کاشتکاری کے طریقوں سے اگائی جاتی ہیں اور قابل اعتماد حکام سے تصدیق شدہ ہیں۔",
    },
    {
      icon: <Truck className="h-10 w-10 text-green-600" />,
      title: "تیز ترسیل",
      description: "2000 روپے سے زائد کے آرڈرز پر مفت شپنگ کے ساتھ 2-3 کاروباری دنوں میں ترسیل۔",
    },
  ]

  const stats = [
    { value: "50+", label: "جڑی بوٹیوں کی مصنوعات" },
    { value: "10K+", label: "خوش گاہک" },
    { value: "100%", label: "قدرتی اجزاء" },
    { value: "20+", label: "سال کا تجربہ" },
  ]

  return (
    <div className="flex flex-col justify-center min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center">
        <div className="container flex h-16 items-center justify-between">
          <Link className="flex items-center justify-center gap-2" href="/">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="font-bold text-xl">ہربل لائف</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium transition-colors hover:text-green-600">
              مصنوعات
            </Link>
            <Link href="#features" className="text-sm font-medium transition-colors hover:text-green-600">
              خصوصیات
            </Link>
            <Link href="#testimonials" className="text-sm font-medium transition-colors hover:text-green-600">
              تعریفیں
            </Link>
            <Link href="#faq" className="text-sm font-medium transition-colors hover:text-green-600">
              عمومی سوالات
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost">براؤز کریں</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700">لاگ ان</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 ">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-green-50 to-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="inline-flex rounded-md px-3.5 py-1.5 text-sm font-medium bg-green-100 text-green-800">
                    نیا مجموعہ دستیاب
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    بہتر صحت کے لیے <span className="text-green-600">قدرتی جڑی بوٹیوں کے حل</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    ہماری اعلیٰ معیار کی جڑی بوٹیوں کی مصنوعات کا منتخب کردہ مجموعہ دریافت کریں جو آپ کی تندرستی کو بہتر بنانے کے لیے ڈیزائن کیا گیا ہے۔ خالص، طاقتور، اور روایت سے پشت پناہی حاصل۔
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/products">
                    <Button size="lg" className="group bg-green-600 hover:bg-green-700">
                      ابھی خریدیں
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      مزید جانیں
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <h3 className="text-2xl md:text-3xl font-bold text-green-600">{stat.value}</h3>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-muted sm:h-[450px] lg:h-[500px]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-100/50 to-transparent rounded-xl"></div>
                  <img
                    alt="جڑی بوٹیوں کی مصنوعات کا نمائش"
                    className="object-cover w-full h-full transition-all hover:scale-105 duration-500"
                    src="/placeholder.svg?height=500&width=500&text=پریمیم+جڑی+بوٹیوں+کی+مصنوعات"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 bg-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  ہمیں کیوں منتخب کریں
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">فطرت کے بہترین فوائد</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ہم ان اہم فوائد کے ساتھ اعلیٰ معیار کی جڑی بوٹیوں کی مصنوعات فراہم کرنے کے لیے پرعزم ہیں
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-white border-2 border-muted transition-all duration-200 hover:border-green-200 hover:shadow-md"
                >
                  <CardHeader className="p-4 pb-2 flex flex-col items-center">
                    <div className="p-2 rounded-full bg-green-50 mb-4">{feature.icon}</div>
                    <CardTitle className="text-xl text-center">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 text-center">
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Special Offers Section */}
        {activeOffers.length > 0 && (
          <section className="w-full py-12 md:py-16 bg-green-50 flex justify-center">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <Badge className="bg-green-600 text-white">محدود وقت</Badge>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-green-800">خصوصی پیشکشیں</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    ہماری پریمیم جڑی بوٹیوں کی مصنوعات پر خصوصی سودے۔ ختم ہونے سے پہلے جلدی کریں۔
                  </p>
                </div>
              </div>

              <div className="relative mt-8">
                <div ref={carouselRef} className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 hide-scrollbar">
                  {activeOffers.map((offer) => (
                    <div key={offer.id} className="min-w-[300px] md:min-w-[350px] snap-center">
                      <Card className="h-full bg-white border-2 hover:border-green-300 transition-all duration-200">
                        <CardHeader className="bg-green-100 rounded-t-lg">
                          <CardTitle className="text-green-800 flex items-center justify-between">
                            {offer.name}
                            <Badge className="bg-green-600 hover:bg-green-700">{offer.discountPercentage}% رعایت</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <p className="text-muted-foreground">{offer.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              اختتام: {new Date(offer.endDate).toLocaleDateString('ur-PK')}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Link href="/products" className="w-full">
                            <Button className="w-full bg-green-600 hover:bg-green-700">ابھی خریدیں</Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    </div>
                  ))}
                </div>

                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-2 shadow-md hover:bg-green-50 transition-all duration-200 hidden md:flex"
                >
                  <ChevronLeft className="h-6 w-6 text-green-800" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white rounded-full p-2 shadow-md hover:bg-green-50 transition-all duration-200 hidden md:flex"
                >
                  <ChevronRight className="h-6 w-6 text-green-800" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="w-full py-12 md:py-24 bg-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  سرفہرست انتخاب
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">نمایاں جڑی بوٹیوں کی مصنوعات</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ہماری سب سے مقبول اور اعلیٰ درجہ بندی کی قدرتی علاج دریافت کریں
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="bg-green-50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                    سب
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-3 flex justify-center items-center h-64">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <h3 className="text-lg font-medium">کوئی مصنوعات نہیں ملیں</h3>
                  <p className="text-muted-foreground">ہماری نمایاں مصنوعات کے لیے بعد میں دوبارہ چیک کریں۔</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group overflow-hidden border-2 hover:border-green-300 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-muted relative">
                      <img
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-500"
                        src={
                          product.imageUrl ||
                          `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(product.name) || "جڑی+بوٹیوں+کی+مصنوعات"}`
                        }
                      />
                      {product.originalPrice && (
                        <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                          {product.discountPercentage}% رعایت
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description || "آپ کی تندرستی کے لیے پریمیم جڑی بوٹیوں کی مصنوعات"}
                      </p>
                      <div className="mt-2">
                        {product.originalPrice ? (
                          <div>
                            <p className="font-bold text-lg text-green-700">
                              روپے {product.price?.toFixed(2)}
                              <span className="text-sm ml-2 line-through text-muted-foreground">
                                روپے {product.originalPrice?.toFixed(2)}
                              </span>
                            </p>
                            <p className="text-xs text-green-600">{product.offerName}</p>
                          </div>
                        ) : (
                          <p className="font-bold text-lg">روپے {product.price?.toFixed(2) || "0.00"}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        زمرہ: {getCategoryName(product.categoryId)}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link href={`/products?product=${product.id}`} className="w-full">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                          تفصیلات دیکھیں
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            <div className="flex justify-center mt-8">
              <Link href="/products">
                <Button size="lg" variant="outline" className="group border-green-600 text-green-600 hover:bg-green-50">
                  تمام مصنوعات دیکھیں
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 bg-green-50 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  تعریفیں
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">ہمارے صارفین کیا کہتے ہیں</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  صرف ہمارے کہنے پر یقین نہ کریں - ہمارے مطمئن صارفین سے سنیں
                </p>
              </div>
            </div>

            <div className="mx-auto max-w-4xl mt-12">
              <div className="relative">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className={`transition-opacity duration-1000 ${
                      index === currentTestimonial ? "opacity-100" : "opacity-0 absolute inset-0"
                    }`}
                  >
                    <Card className="bg-white border-none shadow-md">
                      <CardContent className="pt-10 pb-10 px-6 md:px-10">
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-4">
                            <img
                              src={testimonial.avatar || "/placeholder.svg"}
                              alt={testimonial.name}
                              className="rounded-full w-16 h-16 border-4 border-green-100"
                            />
                          </div>
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
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                <div className="flex justify-center mt-6 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentTestimonial ? "bg-green-600" : "bg-muted"
                      }`}
                      aria-label={`تعریف نمبر ${index + 1} پر جائیں`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-12 md:py-24 bg-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  عمومی سوالات
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">بار بار پوچھے جانے والے سوالات</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ہماری جڑی بوٹیوں کی مصنوعات کے بارے میں عام سوالات کے جوابات تلاش کریں
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-3xl gap-4 py-12">
              <Card>
                <CardHeader>
                  <CardTitle>کیا آپ کی جڑی بوٹیوں کی مصنوعات استعمال کے لیے محفوظ ہیں؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    جی ہاں، ہماری تمام جڑی بوٹیوں کی مصنوعات قدرتی اجزاء سے بنائی جاتی ہیں اور سخت معیار کی جانچ سے گزرتی ہیں۔
                    تاہم، ہم کسی بھی نئے ضمیمہ پروگرام شروع کرنے سے پہلے صحت کے پیشہ ور سے مشورہ کرنے کی سفارش کرتے ہیں، خاص طور پر اگر آپ کی کوئی موجودہ صحت کی حالت ہو یا آپ دوائیں لے رہے ہوں۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>شپنگ میں کتنا وقت لگتا ہے؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    معیاری شپنگ عام طور پر پاکستان کے اندر 2-5 کاروباری دن لگتی ہے۔ تیز ترسیل کے لیے چیک آؤٹ پر ایکسپریس شپنگ کے اختیارات دستیاب ہیں۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>آپ کی واپسی کی پالیسی کیا ہے؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    ہم زیادہ تر اشیاء پر 30 دن کی واپسی کی پالیسی پیش کرتے ہیں۔ مصنوعات اپنی اصل حالت میں تمام پیکیجنگ کے ساتھ ہونی چاہئیں۔ کچھ مصنوعات کے زمرے کے لیے کچھ استثناء लागو ہوتے ہیں۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>میں اپنی جڑی بوٹیوں کی مصنوعات کو کیسے ذخیرہ کروں؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    بہترین طاقت اور شیلف لائف کے لیے، اپنی جڑی بوٹیوں کی مصنوعات کو ٹھنڈی، خشک جگہ پر براہ راست سورج کی روشنی سے دور رکھیں۔ زیادہ تر مصنوعات کو کمرے کے درجہ حرارت پر رکھنا چاہیے، لیکن مخصوص ذخیرہ کرنے کی ہدایات ہر پروڈکٹ لیبل پر فراہم کی جاتی ہیں۔
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>کیا بڑے آرڈرز کے لیے کوئی رعایت ہے؟</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    جی ہاں، ہم بڑے پیمانے پر خریداری کے لیے حجم کی رعایت پیش کرتے ہیں۔ براہ کرم بڑے آرڈرز یا کاروباری اکاؤنٹس کے لیے حسب ضرورت کوٹ کے لیے ہماری سیلز ٹیم سے رابطہ کریں۔
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-green-700 text-white flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  کیا آپ قدرتی تندرستی کا تجربہ کرنے کے لیے تیار ہیں؟
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ہزاروں مطمئن صارفین میں شامل ہوں اور آج ہی ہماری پریمیم جڑی بوٹیوں کی مصنوعات دریافت کریں۔
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/products">
                  <Button size="lg" variant="secondary" className="group">
                    ابھی خریدیں
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white/10"
                  >
                    سائن ان کریں
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-white py-12 flex justify-center">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                <span className="font-bold text-xl">ہربل لائف</span>
              </div>
              <p className="text-sm text-muted-foreground">صحت مند، متوازن زندگی کے لیے قدرتی جڑی بوٹیوں کے علاج۔</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">فوری لنکس</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-green-600 transition-colors">
                    مصنوعات
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-green-600 transition-colors">
                    خصوصیات
                  </Link>
                </li>
                <li>
                  <Link href="#testimonials" className="text-muted-foreground hover:text-green-600 transition-colors">
                    تعریفیں
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-muted-foreground hover:text-green-600 transition-colors">
                    عمومی سوالات
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">کسٹمر سروس</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    ہم سے رابطہ کریں
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    شپنگ پالیسی
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    واپسی اور رقم کی واپسی
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                    رازداری کی پالیسی
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
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  سبسکرائب کریں
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">© 2024 ہربل لائف۔ جملہ حقوق محفوظ ہیں۔</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                <span className="sr-only">فیس بک</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                <span className="sr-only">ٹوئٹر</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                <span className="sr-only">انسٹاگرام</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}